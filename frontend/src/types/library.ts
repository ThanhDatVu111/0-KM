export interface Book {
  id: string;
  couple_id: string;
  title: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookDTO {
  couple_id: string;
  title: string;
  color: string;
}

export interface UpdateBookDTO {
  title?: string;
  color?: string;
}
