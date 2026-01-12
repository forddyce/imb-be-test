importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyDTImCyuxrnbIYyL7EdHDRO3VYeH-6-Z54',
    authDomain: 'my--projects-cc848.firebaseapp.com',
    projectId: 'my--projects-cc848',
    storageBucket: 'my--projects-cc848.firebasestorage.app',
    messagingSenderId: '373404275976',
    appId: '1:373404275976:web:6ffdc687213eea6fb8c8bd',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification?.title || 'New Message';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/firebase-logo.png',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
