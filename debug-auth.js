// Debug script - paste this into browser console to check authentication state
console.log('=== AUTH DEBUG ===');
console.log('1. Access Token:', localStorage.getItem('access_token'));
console.log('2. User Data:', localStorage.getItem('user'));
console.log('3. Session Expired Flag:', sessionStorage.getItem('session_expired'));

// Decode JWT token to check expiry
const token = localStorage.getItem('access_token');
if (token) {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log('4. Token Payload:', payload);
      console.log('5. Token Expiry:', new Date(payload.exp * 1000));
      console.log('6. Current Time:', new Date());
      console.log('7. Token Expired?', payload.exp * 1000 < Date.now());
    }
  } catch (e) {
    console.error('8. Failed to decode token:', e);
  }
} else {
  console.log('4-8. NO TOKEN FOUND IN LOCALSTORAGE');
}

// Test a psychology API call with the current token
console.log('\n=== TESTING API CALL ===');
fetch('http://localhost:8080/api/v1/psychology/patients/357f2edd-fd52-468b-bb13-755ee2ddd516/goals', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(async res => {
  console.log('9. Response Status:', res.status);
  console.log('10. Response Headers:', Object.fromEntries(res.headers.entries()));
  const text = await res.text();
  console.log('11. Response Body:', text);
  try {
    console.log('12. Parsed JSON:', JSON.parse(text));
  } catch (e) {
    console.log('12. Not JSON response');
  }
})
.catch(err => console.error('13. Fetch Error:', err));
