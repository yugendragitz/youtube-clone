import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";

// 🔥 Google Translate API (free)
async function translateText(text: string, target: string) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURI(
    text
  )}`;

  const res = await fetch(url);
  const data = await res.json();
  return data[0][0][0];
}

const Comments = ({ videoId }: any) => {
  const { user } = useUser();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const [translateLang, setTranslateLang] = useState("en");
  const [translated, setTranslated] = useState<{ [key: string]: string }>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  useEffect(() => {
    loadComments();
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  // ❌ Block special characters
  const valid = (t: string) => /^[a-zA-Z0-9\s.,!?'"-]*$/.test(t);

  // Add comment
  const addComment = async () => {
    if (!user || !newComment.trim() || !city.trim()) return;
    if (!valid(newComment)) return alert("No special characters allowed!");

    await axiosInstance.post("/comment/postcomment", {
      videoid: videoId,
      userid: user._id,
      commentbody: newComment,
      usercommented: user.name,
      usercity: city,
    });

    setNewComment("");
    setCity("");
    loadComments();
  };

  // LIKE
  const like = async (id: string) => {
    await axiosInstance.post(`/comment/like/${id}`);
    loadComments();
  };

  // DISLIKE (auto delete if 2 dislikes)
  const dislike = async (id: string) => {
    const res = await axiosInstance.post(`/comment/dislike/${id}`);
    if (res.data.deleted) {
      setComments((p) => p.filter((c) => c._id !== id));
    } else {
      loadComments();
    }
  };

  // EDIT save
  const saveEdit = async (id: string) => {
    if (!valid(editText)) return alert("No special characters allowed!");

    await axiosInstance.post(`/comment/editcomment/${id}`, {
      newtext: editText,
    });

    setEditingId(null);
    setEditText("");
    loadComments();
  };

  // DELETE
  const deleteComment = async (id: string) => {
    await axiosInstance.delete(`/comment/deletecomment/${id}`);
    loadComments();
  };

  // TRANSLATE
  const translate = async (id: string, text: string) => {
    const out = await translateText(text, translateLang);
    setTranslated((prev) => ({ ...prev, [id]: out }));
  };

  if (loading) return <p>Loading comments...</p>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {/* Input row */}
      {user && (
        <div className="flex gap-4">
          <Avatar>
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
              className="w-full px-3 py-2 rounded bg-gray-100 text-black"
            />

            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px]"
            />

            <Button onClick={addComment}>Comment</Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {comments.map((c) => (
          <div key={c._id} className="flex gap-4 border-b pb-4">
            <Avatar>
              <AvatarFallback>{c.usercommented[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex gap-3 text-sm">
                <span className="font-semibold">{c.usercommented}</span>
                <span className="text-gray-500">• {c.usercity}</span>
                <span className="text-gray-500">
                  {formatDistanceToNow(new Date(c.commentedon))} ago
                </span>
              </div>

              {/* If editing */}
              {editingId === c._id ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <Button onClick={() => saveEdit(c._id)}>Save</Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-1">{c.commentbody}</p>
              )}

              {/* Like + Dislike */}
              <div className="flex gap-5 mt-2 text-sm">
                <button onClick={() => like(c._id)}>👍 {c.likes}</button>
                <button onClick={() => dislike(c._id)}>👎 {c.dislikes}</button>

                {/* Translate */}
                <select
                  className="bg-gray-200 px-2 rounded"
                  value={translateLang}
                  onChange={(e) => setTranslateLang(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                  <option value="ta">Tamil</option>
                  <option value="ml">Malayalam</option>
                  <option value="kn">Kannada</option>
                </select>

                <button
                  className="text-purple-600"
                  onClick={() => translate(c._id, c.commentbody)}
                >
                  Translate
                </button>
              </div>

              {/* Translated text */}
              {translated[c._id] && (
                <p className="mt-2 text-sm text-purple-700 italic">
                  {translated[c._id]}
                </p>
              )}

              {/* Edit + Delete only for YOUR comment */}
              {c.userid === user?._id && (
                <div className="flex gap-4 text-sm text-gray-600 mt-2">
                  <button
                    onClick={() => {
                      setEditingId(c._id);
                      setEditText(c.commentbody);
                    }}
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteComment(c._id)}>Delete</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Comments;
