import "./style.css";

const form = document.getElementById("reset-form");
const responseDiv = document.getElementById("response");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.elements.email.value;
  responseDiv.innerHTML = `<p class="text-yellow-400">Sending request to the vulnerable server...</p>`;

  try {
    const response = await fetch(
      "http://localhost:3000/request-password-reset",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Request failed");
    }

    // Guide the user to the next step
    responseDiv.innerHTML = `
                    <p class="text-green-400 font-bold">Request successful!</p>
                    <p class="mt-2">The vulnerable server has dispatched a password reset email.</p>
                    <p class="mt-2 font-bold">Now, go check the <span class="text-yellow-400">VULNERABLE SERVER's</span> terminal to see the simulated email.</p>
                `;
  } catch (error) {
    responseDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
  }
});
