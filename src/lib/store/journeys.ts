import type { SupabaseClient } from "@supabase/supabase-js";
import type { Journey } from "@/lib/domain/types";

const TABLE = "journeys";

/**
 * Reads and writes the signed-in user's journeys. Row Level Security
 * (supabase/migrations) limits every query to the caller's own rows, so reads
 * need no user filter and another user's id can never be written.
 */
export class JourneyStore {
  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  /** Most recently updated first. */
  async list(): Promise<Journey[]> {
    const { data, error } = await this.client
      .from(TABLE)
      .select("data")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data.map((row) => row.data as Journey);
  }

  async get(id: string): Promise<Journey | null> {
    const { data, error } = await this.client.from(TABLE).select("data").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data?.data as Journey | undefined) ?? null;
  }

  async save(journey: Journey): Promise<void> {
    const { error } = await this.client.from(TABLE).upsert({
      id: journey.id,
      user_id: this.userId,
      topic: journey.topic,
      title: journey.title,
      data: journey,
      created_at: journey.createdAt,
      updated_at: journey.updatedAt,
    });
    if (error) throw error;
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client.from(TABLE).delete().eq("id", id);
    if (error) throw error;
  }
}
