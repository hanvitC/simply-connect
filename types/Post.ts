export interface Post {
  id: string;
  userId: string;
  caption: string;
  imageUrl?: string;
  timestamp: Date;
  comments?: number;
}