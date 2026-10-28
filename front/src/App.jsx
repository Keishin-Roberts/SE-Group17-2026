import './index.css'

function App() {
  async function showTime() {
    const response = await fetch('http://localhost:3000/time')
    const data = await response.json()

    alert(data.time)
  }



  return (
    <div className="container">
      <h1>Hello world!</h1>
      <p>My content goes here.</p>
      <p>Steve Jobs webchat</p>


      <button onClick={showTime}>Show time</button>
    </div>
  )
}

export default App
