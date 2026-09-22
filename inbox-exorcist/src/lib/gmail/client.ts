import { AppError } from "../errors.ts";
import { getHeader, type GmailHeader } from "./headers.ts";
import { mapGmailError } from "./error-map.ts";
import type { UnsubscribeOption } from "../unsubscribe/engine.ts";
import { extractUnsubscribeTargets } from "./headers.ts";

export type GmailMessageHeader = {
  id: string;
  labelIds: string[];
  headers: GmailHeader[];
};

export type GmailLabel = {
  id: string;
  name: string;
};

export type GmailFilter = {
  id: string;
};

export type GmailClient = {
  listRecentMessageHeaders(input: {
    query: string;
    maxMessages: number;
  }): Promise<GmailMessageHeader[]>;
  listMessageIdsForSender(input: {
    senderDomain: string;
    maxMessages: number;
  }): Promise<string[]>;
  ensureLabel(name: string): Promise<GmailLabel>;
  createQuietFilter(input: {
    senderDomain: string;
    labelId: string;
  }): Promise<GmailFilter>;
  batchModifyMessages(input: {
    messageIds: string[];
    addLabelIds: string[];
    removeLabelIds: string[];
  }): Promise<{ modifiedCount: number }>;
  deleteFilter(filterId: string): Promise<void>;
  getSenderUnsubscribeOptions(senderDomain: string): Promise<UnsubscribeOption[]>;
  sendRawEmail?(rawBase64Url: string): Promise<{ id: string }>;
};

type GmailListResponse = {
  messages?: Array<{ id: string }>;
  nextPageToken?: string;
};

type GmailMessageResponse = {
  id: string;
  labelIds?: string[];
  payload?: { headers?: GmailHeader[] };
};

export class GmailHttpClient implements GmailClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async gmailFetch<T>(path: string, init: RequestInit = {}) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${this.accessToken}`,
        "content-type": "application/json",
        ...(init.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw mapGmailError(response.status, text);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async listRecentMessageHeaders({
    query,
    maxMessages,
  }: {
    query: string;
    maxMessages: number;
  }) {
    const ids: string[] = [];
    let pageToken: string | undefined;

    while (ids.length < maxMessages) {
      const params = new URLSearchParams({
        q: query,
        maxResults: String(Math.min(100, maxMessages - ids.length)),
        includeSpamTrash: "false",
      });
      if (pageToken) params.set("pageToken", pageToken);

      const page = await this.gmailFetch<GmailListResponse>(
        `/messages?${params.toString()}`,
      );
      ids.push(...(page.messages || []).map((message) => message.id));
      pageToken = page.nextPageToken;
      if (!pageToken) break;
    }

    const metadataHeaders = [
      "From",
      "Sender",
      "List-Unsubscribe",
      "List-Unsubscribe-Post",
      "List-ID",
      "Precedence",
      "Auto-Submitted",
      "Subject",
      "Reply-To",
    ];

    const messages: GmailMessageHeader[] = [];
    for (const id of ids) {
      const params = new URLSearchParams({ format: "metadata" });
      for (const header of metadataHeaders) {
        params.append("metadataHeaders", header);
      }
      const message = await this.gmailFetch<GmailMessageResponse>(
        `/messages/${encodeURIComponent(id)}?${params.toString()}`,
      );
      messages.push({
        id: message.id,
        labelIds: message.labelIds || [],
        headers: message.payload?.headers || [],
      });
    }

    return messages;
  }

  async listMessageIdsForSender({
    senderDomain,
    maxMessages,
  }: {
    senderDomain: string;
    maxMessages: number;
  }) {
    const query = `newer_than:180d from:(@${senderDomain})`;
    const page = await this.gmailFetch<GmailListResponse>(
      `/messages?${new URLSearchParams({
        q: query,
        maxResults: String(Math.min(maxMessages, 500)),
        includeSpamTrash: "false",
      }).toString()}`,
    );
    return (page.messages || []).map((message) => message.id);
  }

  async ensureLabel(name: string) {
    const existing = await this.gmailFetch<{ labels?: GmailLabel[] }>("/labels");
    const match = existing.labels?.find((label) => label.name === name);
    if (match) {
      return match;
    }

    return this.gmailFetch<GmailLabel>("/labels", {
      method: "POST",
      body: JSON.stringify({
        name,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      }),
    });
  }

  async createQuietFilter({
    senderDomain,
    labelId,
  }: {
    senderDomain: string;
    labelId: string;
  }) {
    return this.gmailFetch<GmailFilter>("/settings/filters", {
      method: "POST",
      body: JSON.stringify({
        criteria: { from: `@${senderDomain}` },
        action: {
          addLabelIds: [labelId],
          removeLabelIds: ["INBOX"],
        },
      }),
    });
  }

  async batchModifyMessages({
    messageIds,
    addLabelIds,
    removeLabelIds,
  }: {
    messageIds: string[];
    addLabelIds: string[];
    removeLabelIds: string[];
  }) {
    let modifiedCount = 0;
    for (let index = 0; index < messageIds.length; index += 1000) {
      const ids = messageIds.slice(index, index + 1000);
      if (ids.length === 0) continue;
      await this.gmailFetch("/messages/batchModify", {
        method: "POST",
        body: JSON.stringify({ ids, addLabelIds, removeLabelIds }),
      });
      modifiedCount += ids.length;
    }
    return { modifiedCount };
  }

  async deleteFilter(filterId: string) {
    await this.gmailFetch(`/settings/filters/${encodeURIComponent(filterId)}`, {
      method: "DELETE",
    });
  }

  async getSenderUnsubscribeOptions(senderDomain: string) {
    const messages = await this.listRecentMessageHeaders({
      query: `newer_than:180d from:(@${senderDomain})`,
      maxMessages: 3,
    });
    const options: UnsubscribeOption[] = [];

    for (const message of messages) {
      const listUnsubscribe = getHeader(message.headers, "List-Unsubscribe");
      const oneClick = /List-Unsubscribe=One-Click/i.test(
        getHeader(message.headers, "List-Unsubscribe-Post") || "",
      );
      for (const target of extractUnsubscribeTargets(listUnsubscribe)) {
        if (target.startsWith("https://")) {
          options.push({ method: "https", target, oneClickPost: oneClick });
        }
        if (target.startsWith("mailto:")) {
          options.push({ method: "mailto", target });
        }
      }
    }

    return options;
  }

  async sendRawEmail(rawBase64Url: string) {
    if (!rawBase64Url) {
      throw new AppError({
        code: "MAILTO_UNSUBSCRIBE_EMPTY_MESSAGE",
        message: "Cannot send an empty unsubscribe email.",
        status: 400,
      });
    }

    return this.gmailFetch<{ id: string }>("/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: rawBase64Url }),
    });
  }
}
