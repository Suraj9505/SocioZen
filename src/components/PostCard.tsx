"use client";

import {
  createComment,
  deletePost,
  getPosts,
  toggleLike,
} from "@/actions/post.action";
import useMedia from "use-media";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Avatar, AvatarImage } from "./ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { Button } from "./ui/button";
import {
  HeartIcon,
  LogInIcon,
  MessageCircleIcon,
  SendIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { ScrollArea } from "./ui/scroll-area";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: String | null }) {
  const { user } = useUser();
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(
    post.likes.some((like) => like.userId === dbUserId)
  );
  const [optimisticLikes, setOptimisticLikes] = useState(post._count.likes);
  const [showComments, setShowComments] = useState(false);

  const mediumScreen = useMedia({ minWidth: "768px" });

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      setHasLiked(!hasLiked);
      setOptimisticLikes(hasLiked ? optimisticLikes - 1 : optimisticLikes + 1);
      await toggleLike(post.id);
    } catch (error) {
      setOptimisticLikes(post._count.likes);
      setHasLiked(false);
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      if (result?.success) {
        toast.success("Comment added successfully");
        setNewComment("");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);
      if (result?.success) {
        toast.success("Post deleted successfully");
      }
    } catch (error) {
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden w-full">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex space-x-3 sm:space-x-4">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="size-8 sm:size-10">
                <AvatarImage src={post.author.image || "/avatar.png"} />
              </Avatar>
            </Link>

            {/* Post header and text content of the post  */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold truncate capitalize"
                  >
                    {post.author.name}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${post.author.username}`}>
                      @{post.author.username}
                    </Link>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt))} ago
                    </span>
                  </div>
                </div>
                {/* Check if current user is the post author */}
                {dbUserId === post.author.id && (
                  <DeleteAlertDialog
                    isDeleting={isDeleting}
                    onDelete={handleDeletePost}
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-foreground break-words">
                {post.content}
              </p>
            </div>
          </div>
          {/* Post Image */}
          {post.image && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image}
                alt="post content"
                className="w-full h-auto object-cover"
              />
            </div>
          )}
          {/* Like and Comment buttons */}
          <div className="flex items-center pt-2 space-x-4">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground gap-2 ${
                  hasLiked
                    ? "text-red-500 hover:text-red-600"
                    : "hover:text-red-500"
                }`}
                onClick={handleLike}
              >
                {hasLiked ? (
                  <HeartIcon className="size-5 fill-current" />
                ) : (
                  <HeartIcon className="size-5" />
                )}
                <span>{optimisticLikes}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2"
                >
                  <HeartIcon className="size-5" />
                  <span>{optimisticLikes}</span>
                </Button>
              </SignInButton>
            )}

            {/* Comment Section */}
            <Sheet open={showComments} onOpenChange={setShowComments}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2 hover:text-blue-500"
                >
                  <MessageCircleIcon
                    className={`size-5 ${
                      showComments ? "fill-blue-500 text-blue-500" : ""
                    }`}
                  />
                  <span>{post.comments.length}</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side={mediumScreen ? "right" : "bottom"}
                className="lg:side-right w-full h-[80%] sm:w-[140%] md:h-full"
              >
                <SheetHeader className="hidden md:block">
                  <SheetTitle className="flex items-center space-x-3">
                    <Link href={`/profile/${post.author.username}`}>
                      <Avatar className="size-6 sm:size-8">
                        <AvatarImage src={post.author.image || "/avatar.png"} />
                      </Avatar>
                    </Link>
                    <div className="flex-sm text-muted-foreground truncate capitalize">
                      <Link href={`/profile/${post.author.username}`}>
                        {post.author.name}
                      </Link>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                <Separator className="hidden md:block my-3" />
                {/* Comments */}
                <div className="flex flex-col justify-between md:h-[calc(100vh-150px)] h-[90%]">
                  <ScrollArea className="h-full rounded-lg">
                    {post.comments.length > 0 ? (
                      post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex items-center space-x-3"
                        >
                          <Avatar className="size-8 flex-shrink-0">
                            <AvatarImage
                              src={comment.author.image ?? "/avatar.png"}
                            />
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="font-medium text-sm capitalize">
                                {comment.author.name}
                              </span>
                              {/* <span className="text-sm text-muted-foreground">
                                @{comment.author.username}
                              </span> */}
                              <span className="text-sm text-muted-foreground">
                                ·
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(
                                  new Date(comment.createdAt)
                                )}{" "}
                                ago
                              </span>
                            </div>
                            <p className="text-sm break-words">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground flex justify-center items-center">
                        No comments yet
                      </p>
                    )}
                  </ScrollArea>
                  {/* Add comment  */}
                  {user ? (
                    <div className="">
                      <Textarea
                        placeholder="Write a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none relative"
                      />
                      <div className="flex justify-end mt-2 absolute">
                        <Button
                          size="sm"
                          onClick={handleAddComment}
                          className="flex items-center gap-2"
                          disabled={!newComment.trim() || isCommenting}
                        >
                          {isCommenting ? (
                            "Posting..."
                          ) : (
                            <>
                              <SendIcon className="size-4" />
                              Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                      <SignInButton mode="modal">
                        <Button variant="outline" className="gap-2">
                          <LogInIcon className="size-4" />
                          Sign in to comment
                        </Button>
                      </SignInButton>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PostCard;
