import React from "react";

export default function Loading() {
  return (
    <div>
      <section>
        <div className="flex flex-row gap-2 justify-center items-center min-h-screen">
          <div className="w-4 h-4 rounded-full bg-quaternary animate-bounce" />
          <div className="w-4 h-4 rounded-full bg-quaternary animate-bounce [animation-delay:-.3s]" />
          <div className="w-4 h-4 rounded-full bg-quaternary animate-bounce [animation-delay:-.5s]" />
        </div>
      </section>
    </div>
  );
}
