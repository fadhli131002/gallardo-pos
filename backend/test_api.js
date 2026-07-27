async function testFetch() {
  try {
    const res = await fetch('http://localhost:5000/api/transactions');
    const data = await res.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testFetch();
