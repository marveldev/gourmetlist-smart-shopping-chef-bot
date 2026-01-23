import { auth } from "./firebase.js"
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	signOut,
	onAuthStateChanged,
	sendPasswordResetEmail,
	signInWithPopup,
	GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js"

const signOutButton = document.getElementById("sign-out-button")
const signInButton = document.getElementById("sign-in-button")
const createAccountButton = document.getElementById("create-account-button")
const authSignInButton = document.getElementById("auth-signin-button")
const authCreateAccountButton = document.getElementById(
	"auth-create-account-button"
)
const launchAppButton = document.getElementById("launch-app-button")
const forgotPasswordButton = document.getElementById("forgot-password-button")
let currentUser = null

onAuthState((user) => {
	if (user) {
		signInButton?.classList.add("hidden")
		createAccountButton?.classList.add("hidden")
		signOutButton?.classList.remove("hidden")
		launchAppButton?.classList.remove("hidden")
		currentUser = user
	} else {
		signInButton?.classList.remove("hidden")
		createAccountButton?.classList.remove("hidden")
		signOutButton?.classList.add("hidden")
		launchAppButton?.classList.add("hidden")
	}
})

// --------------------
// UTILITY FUNCTIONS
// --------------------
function showError(id, message) {
	const el = document.getElementById(id)
	if (!el) return
	el.textContent = message
	el.classList.remove("hidden")
}

function hideError(id) {
	const el = document.getElementById(id)
	if (!el) return
	el.textContent = ""
	el.classList.add("hidden")
}

// --------------------
// CREATE ACCOUNT FUNCTION
// --------------------

export async function createAccount(email, password, confirmPassword) {
	hideError("email-error")
	hideError("password-error")
	hideError("confirm-password-error")

	if (password !== confirmPassword) {
		showError("confirm-password-error", "Passwords do not match")
		return false
	}

	try {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		)
		console.log("User created:", userCredential.user)
		window.location.href = "app.html"
		return true
	} catch (error) {
		switch (error.code) {
			case "auth/email-already-in-use":
				showError("email-error", "Email already in use. Please sign in.")
				break
			case "auth/invalid-email":
				showError("email-error", "Invalid email format.")
				break
			case "auth/weak-password":
				showError("password-error", "Password must be at least 6 characters.")
				break
			default:
				showError("email-error", "Unable to create account. Try again.")
				console.error(error)
		}
		return false
	}
}

// --------------------
// SIGN IN FUNCTION
// --------------------
export async function signInUser(email, password) {
	hideError("email-error")
	hideError("password-error")

	try {
		const userCredential = await signInWithEmailAndPassword(
			auth,
			email,
			password
		)
		console.log("User signed in:", userCredential.user)
		window.location.href = "app.html"
		return true
	} catch (error) {
		switch (error.code) {
			case "auth/user-not-found":
				showError(
					"email-error",
					"No account found with this email. Please sign up."
				)
				break
			case "auth/wrong-password":
				showError("password-error", "Incorrect password. Try again.")
				break
			case "auth/invalid-email":
				showError("email-error", "Invalid email format.")
				break
			default:
				showError("email-error", "Unable to sign in. Try again.")
				console.error(error)
		}
		return false
	}
}

// --------------------
// SIGN OUT FUNCTION
// --------------------
export async function signUserOut() {
	try {
		await signOut(auth)
		console.log("User signed out successfully")
		window.location.href = "signout.html"
	} catch (error) {
		console.error("Error signing out:", error)
		alert("Unable to sign out. Please try again.")
	}
}

// --------------------
// FORGOT PASSWORD FUNCTION
// --------------------
export async function forgotPassword(email) {
	const msgEl = document.getElementById("password-recovery-msg")
	msgEl.classList.add("hidden")
	hideError("forgot-password-email-msg")

	if (!email) {
		showError(
			"forgot-password-email-msg",
			"Please enter your email to reset password."
		)
		return false
	}

	try {
		await sendPasswordResetEmail(auth, email)
		msgEl.textContent = "Password reset email sent! Check your inbox."
		msgEl.classList.remove("hidden")
		return true
	} catch (error) {
		switch (error.code) {
			case "auth/user-not-found":
				showError(
					"forgot-password-email-msg",
					"No account found with this email."
				)
				break
			case "auth/invalid-email":
				showError("forgot-password-email-msg", "Invalid email format.")
				break
			default:
				showError(
					"forgot-password-email-msg",
					"Unable to send reset email. Try again."
				)
				console.error(error)
		}
		return false
	}
}

// --------------------
// SIGN UP WITH GOOGLE
// --------------------

export async function signUpWithGoogle() {
	const provider = new GoogleAuthProvider()

	try {
		const result = await signInWithPopup(auth, provider)

		const credential = GoogleAuthProvider.credentialFromResult(result)
		const token = credential?.accessToken
		const user = result.user

		// Redirect after success
		window.location.href = "app.html"
	} catch (error) {
		console.error("Google sign-in error:", error)

		if (error.code === "auth/popup-blocked") {
			alert("Popup blocked. Please allow popups or try again.")
		} else if (error.code === "auth/unauthorized-domain") {
			alert("Unauthorized domain. Check Firebase settings.")
		} else {
			alert("Google sign-in failed. Try again.")
		}
	}
}

document
	.getElementById("google-signup-button")
	?.addEventListener("click", (e) => {
		e.preventDefault()
		signUpWithGoogle()
	})

document
	.getElementById("google-signin-button")
	?.addEventListener("click", (e) => {
		e.preventDefault()
		signUpWithGoogle()
	})

document
	.getElementById("start-shopping-button")
	?.addEventListener("click", (e) => {
		e.preventDefault()
		if (currentUser) {
			window.location.href = "app.html"
		} else {
			window.location.href = "signin.html"
		}
	})

authCreateAccountButton?.addEventListener("click", async (e) => {
	e.preventDefault()
	const email = document.getElementById("create-account-email").value
	const password = document.getElementById("create-account-password").value
	const confirmPassword = document.getElementById(
		"confirm-create-account-password"
	).value

	await createAccount(email, password, confirmPassword)
})

authSignInButton?.addEventListener("click", async (e) => {
	e.preventDefault()
	const email = document.getElementById("email").value
	const password = document.getElementById("password").value

	await signInUser(email, password)
})

signOutButton?.addEventListener("click", () => {
	signUserOut()
})

forgotPasswordButton?.addEventListener("click", async (e) => {
	e.preventDefault()
	const email = document.getElementById("email").value
	await forgotPassword(email)
})

// --------------------
// AUTH STATE LISTENER
// --------------------
// Usage: pass a callback to update UI
export function onAuthState(callback) {
	onAuthStateChanged(auth, callback)
}
