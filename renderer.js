// This file contains the JavaScript that executes in the renderer process

document.addEventListener('DOMContentLoaded', () => {
  const greetBtn = document.getElementById('greet-btn');
  const greetingElement = document.getElementById('greeting');
  
  greetBtn.addEventListener('click', () => {
    const greetings = [
      'Hello there!',
      'Welcome to Demir Aslan!',
      'Thanks for using our app!',
      'Have a great day!',
      'You are awesome!'
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    greetingElement.textContent = randomGreeting;
  });
}); 