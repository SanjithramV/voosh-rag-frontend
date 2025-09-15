import React, {useState, useEffect} from 'react';
import { API_BASE } from './config';
import './styles.scss';


export default function App(){
  const [sessionId, setSessionId] = useState(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=> {
    fetch(`${API_BASE}/session/new`, {method:'POST'}).then(r=>r.json()).then(d=> {
      setSessionId(d.sessionId);
      setMessages([{role:'system', text:'Session created locally'}]);
    }).catch(err => setMessages([{role:'system', text: 'Failed to create session: '+err.message}]));
  },[]);

  async function send(){
    if(!input || !input.trim()) return;
    const text = input.trim();
    setInput('');
    setMessages(prev=>[...prev, {role:'user', text}]);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text })
      });
      const data = await res.json();
      const reply = data.reply || (data.error ? `Error: ${data.error}` : 'No reply');
      setMessages(prev=>[...prev, {role:'assistant', text: reply}]);
    } catch (err) {
      setMessages(prev=>[...prev, {role:'assistant', text: 'Network error: '+err.message}]);
    } finally {
      setLoading(false);
    }
  }

  async function reset(){
    if(!sessionId) return;
    await fetch(`${API_BASE}/session/${sessionId}/reset`, { method: 'POST' });
    setMessages([{role:'system', text:'Session reset'}]);
  }

  return (
    <div className='chat-app' style={{maxWidth:800, margin:'20px auto', fontFamily:'Arial, sans-serif'}}>
      <h2>Voosh RAG Chatbot (demo)</h2>
      <div className='chat-window' style={{border:'1px solid #ddd', padding:12, minHeight:300, marginBottom:12, overflowY:'auto'}}>
        {messages.map((m,i)=> <div key={i} style={{marginBottom:8}}>
          <b style={{textTransform:'capitalize'}}>{m.role}:</b> <span>{m.text}</span>
        </div>)}
      </div>
      <div className='controls' style={{display:'flex', gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder='Ask about the news...' style={{flex:1, padding:8}} />
        <button onClick={send} disabled={loading} style={{padding:'8px 12px'}}>Send</button>
        <button onClick={reset} style={{padding:'8px 12px'}}>Reset Session</button>
      </div>
      {loading && <div style={{marginTop:8}}>Loading...</div>}
    </div>
  );
}
