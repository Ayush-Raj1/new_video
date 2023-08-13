async function submitForm(event) {
   event.preventDefault();
   const userId = document.getElementById('userId').value;
   const appointmentDate = document.getElementById('appointment').value;
   const appointmentId = document.getElementById('appointmentId').value;

   const appointmentData = {
      userId: userId,
      appointment: appointmentDate,
      appointmentId: appointmentId
   };
   localStorage.setItem('userId', JSON.stringify(appointmentData));
   console.log('Appointment Data:', appointmentData);
   try {
      const result = await fetch('/generate-link', {
         method: 'POST',
         body: JSON.stringify(appointmentData),
         headers: {
            'Content-Type': 'application/json'
         }
      });
      let response = await result.json();
      if (response) {
         // Redirect to room page
         window.location.href = response.link;
      } else {
         // Handle error
         const errorMessage = await result.text();
         console.log('Error joining room:', errorMessage);
         // Display an error message to the user
      }
   } catch (error) {
      console.log('An error occurred:', error);
      // Handle error and display an error message to the user
   }
   // You can now use the appointmentData for further processing, like sending to a server, etc.
}