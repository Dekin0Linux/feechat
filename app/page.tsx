'use client'
import { useState } from "react";
import Chat from "@/components/Chat";

export default function Home() {
  const [userPhone, setUserPhone] = useState<string>("");

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Enter Your Phone Number</h2>
      <input
        type="text"
        placeholder="Your Phone Number"
        value={userPhone}
        onChange={(e) => setUserPhone(e.target.value)}
        className="px-4 py-2 border rounded-md mb-4 w-full"
      />

      {/* Pass the userPhone to the Chat component */}
      <Chat userPhone={userPhone} />
    </div>
  );
}
