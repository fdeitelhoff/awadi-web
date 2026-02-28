export interface InternalComment {
  id: number;
  ref_table: string;
  ref_id: number;
  kommentar: string;
  user_id?: string;
  user_name?: string;
  created_at: string;
  updated_at?: string;
}
