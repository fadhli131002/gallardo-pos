async function testFetch() {
  try {
    const res = await fetch('http://31.97.51.101/api/transactions');
    const data = await res.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testFetch();
