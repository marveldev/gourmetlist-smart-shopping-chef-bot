import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js"

const firebaseConfig = {
	apiKey: "AIzaSyClLVASspm4_r26aB1XLS4r5Wtd_ncHlVQ",
	authDomain: "basket-auth.firebaseapp.com",
	projectId: "basket-auth",
	storageBucket: "basket-auth.firebasestorage.app",
	messagingSenderId: "522741772466",
	appId: "1:522741772466:web:a4e0f41f779e19bd3d59ab",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
