// auth.js — authentication UI and session bootstrap

async function startApp(user) {
  document.getElementById("auth-overlay").classList.add("hidden");
  document.getElementById("app-layout").classList.remove("hidden");
  document.getElementById("user-email").textContent = user.email;
  await init();
}

function setupAuthUI() {
  const tabSignIn = document.getElementById("tab-signin");
  const tabSignUp = document.getElementById("tab-signup");
  const submitBtn = document.getElementById("auth-submit-btn");
  const form = document.getElementById("auth-form");
  let mode = "signin";

  tabSignIn.addEventListener("click", () => {
    mode = "signin";
    tabSignIn.classList.add("active");
    tabSignUp.classList.remove("active");
    submitBtn.textContent = "Sign In";
    document.getElementById("auth-message").className = "hidden";
    document.getElementById("auth-password").autocomplete = "current-password";
    const confirmField = document.getElementById("auth-confirm-password");
    confirmField.classList.add("hidden");
    confirmField.value = "";
    confirmField.required = false;
  });

  tabSignUp.addEventListener("click", () => {
    mode = "signup";
    tabSignUp.classList.add("active");
    tabSignIn.classList.remove("active");
    submitBtn.textContent = "Sign Up";
    document.getElementById("auth-message").className = "hidden";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-password").autocomplete = "new-password";
    const confirmField = document.getElementById("auth-confirm-password");
    confirmField.classList.remove("hidden");
    confirmField.required = true;
    confirmField.value = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const confirmPassword = document.getElementById("auth-confirm-password").value;
    const msgEl = document.getElementById("auth-message");

    submitBtn.disabled = true;
    msgEl.className = "hidden";

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          msgEl.textContent = "Passwords do not match.";
          msgEl.className = "auth-error";
          document.getElementById("auth-password").value = "";
          document.getElementById("auth-confirm-password").value = "";
          return;
        }
        const result = await signUp(email, password);
        if (result.session) {
          await startApp(result.user);
        } else {
          msgEl.textContent = "Account created! Check your email to confirm, then sign in.";
          msgEl.className = "auth-success";
        }
      } else {
        const result = await signIn(email, password);
        await startApp(result.user);
      }
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.className = "auth-error";
      document.getElementById("auth-password").value = "";
      document.getElementById("auth-confirm-password").value = "";
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem("playerState");
      location.reload();
    }
  });

  document.getElementById("delete-account-btn").addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to delete your account? This will permanently delete your account, all your playlists, and all your uploaded songs. This cannot be undone.");
    if (!confirmed) return;

    const deleteBtn = document.getElementById("delete-account-btn");
    deleteBtn.disabled = true;
    deleteBtn.textContent = "Deleting...";

    try {
      await deleteAccount();
    } catch (err) {
      alert("Could not delete account: " + err.message);
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete Account";
    } finally {
      localStorage.removeItem("playerState");
      location.reload();
    }
  });

  onAuthChange((event) => {
    if (event === "SIGNED_OUT") {
      const appVisible = !document.getElementById("app-layout").classList.contains("hidden");
      if (appVisible) {
        localStorage.removeItem("playerState");
        location.reload();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupAuthUI();
  try {
    const user = await getUser();
    if (user) {
      await startApp(user);
    }
  } catch (err) {
    document.getElementById("auth-message").textContent = "Could not connect. Check your internet connection.";
    document.getElementById("auth-message").className = "auth-error";
  }
});
