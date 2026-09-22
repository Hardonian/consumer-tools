import type {
  GmailClient,
  GmailFilter,
  GmailLabel,
  GmailMessageHeader,
} from "../../src/lib/gmail/client.ts";
import type { UnsubscribeOption } from "../../src/lib/unsubscribe/engine.ts";

export class MockGmailClient implements GmailClient {
  messages: GmailMessageHeader[];
  labels = new Map<string, GmailLabel>();
  filters = new Map<string, { domain: string; labelId: string }>();
  modifiedIds: string[] = [];
  failFilterFor = new Set<string>();

  constructor(messages: GmailMessageHeader[]) {
    this.messages = messages;
  }

  async listRecentMessageHeaders() {
    return this.messages;
  }

  async listMessageIdsForSender({ senderDomain }: { senderDomain: string }) {
    return this.messages
      .filter((message) =>
        message.headers.some(
          (header) =>
            header.name.toLowerCase() === "from" &&
            header.value.toLowerCase().includes(senderDomain),
        ),
      )
      .map((message) => message.id);
  }

  async ensureLabel(name: string) {
    const existing = this.labels.get(name);
    if (existing) return existing;
    const label = { id: `label-${this.labels.size + 1}`, name };
    this.labels.set(name, label);
    return label;
  }

  async createQuietFilter({
    senderDomain,
    labelId,
  }: {
    senderDomain: string;
    labelId: string;
  }): Promise<GmailFilter> {
    if (this.failFilterFor.has(senderDomain)) {
      throw new Error("filter failed");
    }
    const filter = { id: `filter-${this.filters.size + 1}` };
    this.filters.set(filter.id, { domain: senderDomain, labelId });
    return filter;
  }

  async batchModifyMessages({ messageIds }: { messageIds: string[] }) {
    this.modifiedIds.push(...messageIds);
    return { modifiedCount: messageIds.length };
  }

  async deleteFilter(filterId: string) {
    this.filters.delete(filterId);
  }

  async getSenderUnsubscribeOptions(): Promise<UnsubscribeOption[]> {
    return [];
  }
}

export function promoMessage(id: string, domain = "deals.example") {
  return {
    id,
    labelIds: ["CATEGORY_PROMOTIONS"],
    headers: [
      { name: "From", value: `Daily Deals <news@${domain}>` },
      { name: "List-Unsubscribe", value: "<https://unsubscribe.example/one>" },
      { name: "List-ID", value: `deals.${domain}` },
      { name: "Subject", value: "Limited time coupon and sale" },
    ],
  };
}

export function protectedMessage(id: string) {
  return {
    id,
    labelIds: [],
    headers: [
      { name: "From", value: "Bank Alerts <alerts@bank.example>" },
      { name: "Subject", value: "Security alert for your account" },
    ],
  };
}
