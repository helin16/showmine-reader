type iComment = {
  id: string;
  text: string;
  createdAt: string;
  authorName: string;
  authorAvatarUrl: string | null;
  replies?: iComment[];
};

export default iComment;
