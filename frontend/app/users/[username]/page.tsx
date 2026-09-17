"use client";

import { useEffect, useRef, useState } from "react";
import { apiRequest, API_URL } from "@/src/lib/api";
import { useParams, useRouter } from "next/navigation";
import ProfilePage from "./components/ProfilePage";

export default function UnifiedProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const usernameParam = params?.username;

  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  const [edit, setEdit] = useState(false);
  const [bio, setBio] = useState("");
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = bioRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  useEffect(() => {
    if (!usernameParam) return;

    apiRequest(`/users/public/${usernameParam}`)
      .then((res) => {
        setData(res);
        setBio(res?.user?.bio || "");
      })
      .catch(() => setData(null));
  }, [usernameParam]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !usernameParam) return;

    apiRequest("/users/me")
      .then((u) => {
        setMe(u);
        setIsOwner(u?.username === usernameParam);
      })
      .catch(() => {
        setMe(null);
        setIsOwner(false);
      });
  }, [usernameParam]);

  useEffect(() => {
    if (edit) requestAnimationFrame(autoGrow);
  }, [edit]);

  const saveProfile = async () => {
    try {
      const updated = await apiRequest("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ bio }),
      });

      setData((prev: any) => ({
        ...prev,
        user: { ...prev.user, bio: updated?.bio ?? bio },
      }));

      setEdit(false);
    } catch (e: any) {
      alert(e?.message || "Не удалось сохранить");
    }
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);

    const res = await fetch(`${API_URL}/users/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: form,
    });

    const updated = await res.json();

    setMe(updated);
    setData((prev: any) => ({
      ...prev,
      user: { ...prev.user, avatar: updated?.avatar },
    }));
  };

  if (!data) {
    return <div className="p-10 text-white">User not found</div>;
  }

  const { user, stats, solvedTasks } = data;

  return (
    <ProfilePage
      user={user}
      stats={stats}
      solvedTasks={solvedTasks}
      isOwner={isOwner}
      edit={edit}
      bio={bio}
      setBio={setBio}
      setEdit={setEdit}
      saveProfile={saveProfile}
      uploadAvatar={uploadAvatar}
      bioRef={bioRef}
    />
  );
}