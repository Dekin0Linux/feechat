"use client";
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Define message structure
interface Message {
  senderPhone: string;
  message: string;
}

// Define props for Chat component
interface ChatProps {
  userPhone: string;
}

// Initialize socket connection
const socket: Socket = io("http://localhost:4000");

const Chat: React.FC<ChatProps> = ({ userPhone }) => {
  const [receiverPhone, setReceiverPhone] = useState<string>("");
  const [message, setMessage] = useState<string>(""); //message to be sent
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // IF THERE US A USER PHONE NUMBER WE WANT TO EMIT A REGISTER EVENT TO SEND THE NUMBER
    if (userPhone) {
      socket.emit("register", userPhone);
    }

    // Listen for incoming private messages
    socket.on("private_message", (data: Message) => {
        //  SPREADING THE INCOMING MESSAGE INTO OUR OLD MESSAGE IN THE STATE
      setMessages((prev) => [...prev, data]);
    });

    // LISTEN FOR TYPING EVENT TO SEE IF SOMEONE IS TYPING, WHICH GIVES US THE PERSON TYPING PHONE NUMBER
    socket.on("typing", ({ senderPhone }) => {
        // IF THE PHONE NUMBER IS NOT EQUALL TO MY PHONE NUMBER
        if (senderPhone !== userPhone) {
            // SET THE TYPING USER STATE WITH THE SENDERS NUMBER 
          setTypingUser(senderPhone);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 2000);
        }
    });

    return () => {
      socket.off("private_message");
      socket.off("typing");
    };
  }, [userPhone]);

  //   FUNCTION TO SEND MESSAGE TO RECEIVER
  const sendMessage = () => {
    if (!receiverPhone.trim() || !message.trim()) return;

    // send message to receiver if we have a receiver phone number and  we typed a message
    socket.emit("private_message", {
      senderPhone: userPhone,
      receiverPhone,
      message,
    });

    // SETTING OUT LOCAL MESSAGE WITH WHAT WE TYPES
    setMessages((prev) => [...prev, { senderPhone: "You", message }]);
    setMessage(""); //SET MESSAGE STATE TO EMPTY
  };

  //   HANDLE TYPING
  const handleTyping = () => {
    if (!receiverPhone) return; // Ensure we have a receiver WHEN TYPING
    // EMITTING A TYPING EVENT TO THE USER
    socket.emit("typing", { senderPhone: userPhone, receiverPhone });
  };
  

  return (
    <div className="py-4">
      <h3 className="text-lg font-bold mb-2">Chat</h3>
      <input
        type="text"
        placeholder="Receiver Phone Number"
        value={receiverPhone}
        onChange={(e) => setReceiverPhone(e.target.value)}
        className="px-4 py-2 border rounded-md mb-2 w-full"
      />

      <div className="my-4 min-h-[60vh] bg-slate-700 p-5 rounded-md flex flex-col relative">
        <div className="flex flex-col gap-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 text-sm rounded-lg max-w-[75%] ${
                msg.senderPhone === "You"
                  ? "bg-blue-500 text-white self-end" // Sent message (Right-aligned)
                  : "bg-gray-200 text-black self-start" // Received message (Left-aligned)
              }`}
            >
              <strong></strong> {msg.message}
            </div>
          ))}
        </div>

        

        {typingUser && (
        <div className="absolute bottom-2"><em className="text-gray-400 text-sm mt-auto ">Typing...</em></div>
      )}

      </div>

      <div className="flex gap-x-2 ">
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping()
        }}
        onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { // Ensure shift+enter doesn't submit
              e.preventDefault(); // Prevent default behavior
              if (message.trim() !== "") {
                sendMessage(); // Send message
              }
            }
          }}
          className="p-4 border rounded-md w-full "
        />
        <button
          onClick={sendMessage}
          className="px-6 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
