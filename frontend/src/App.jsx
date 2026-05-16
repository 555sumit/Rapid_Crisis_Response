import React, { useState, useEffect } from 'react';

// --- US 911 / Hospital Standard Emergency Color Palettes ---
const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case 'critical': return '#EF4444'; 
    case 'high': return '#F97316';     
    case 'medium': return '#EAB308';   
    default: return '#10B981';         
  }
};

const getCategoryColor = (category) => {
  switch (category?.toLowerCase()) {
    case 'medical': return '#3B82F6';  
    case 'fire': return '#EF4444';     
    case 'security': return '#94A3B8'; 
    case 'natural disaster': return '#8B5CF6'; 
    default: return '#64748B';         
  }
};

// --- MAIN APP CONTAINER ---
export default function RapidCrisisResponse() {
  const [activeTab, setActiveTab] = useState('guest');

  return (
    <div style={{ fontFamily: '"Inter", -apple-system, sans-serif', backgroundColor: '#0B0F19', minHeight: '100vh', color: '#E2E8F0', paddingBottom: '40px' }}>
      
      {/* BRAND HEADER */}
      <header style={{ backgroundColor: '#111827', borderBottom: '1px solid #1F2937', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', letterSpacing: '2px', color: '#F8FAFC', textTransform: 'uppercase' }}>Rapid Crisis Response</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Dispatch System • Local Terminal</p>
        </div>
        
        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: '10px', backgroundColor: '#1F2937', padding: '6px', borderRadius: '8px' }}>
          <button 
            onClick={() => setActiveTab('guest')} 
            style={{ 
              padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s',
              backgroundColor: activeTab === 'guest' ? '#3B82F6' : 'transparent',
              color: activeTab === 'guest' ? '#FFFFFF' : '#94A3B8',
            }}>
            GUEST SOS PORTAL
          </button>
          <button 
            onClick={() => setActiveTab('staff')} 
            style={{ 
              padding: '10px 20px', cursor: 'pointer', borderRadius: '6px', border: 'none', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.2s',
              backgroundColor: activeTab === 'staff' ? '#3B82F6' : 'transparent',
              color: activeTab === 'staff' ? '#FFFFFF' : '#94A3B8',
            }}>
            STAFF CAD DASHBOARD
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <div style={{ maxWidth: activeTab === 'staff' ? '1200px' : '600px', margin: '40px auto', padding: '0 20px', transition: 'max-width 0.3s' }}>
        {activeTab === 'guest' ? <GuestView /> : <StaffDashboard />}
      </div>
    </div>
  );
}

// --- GUEST SOS PORTAL ---
function GuestView() {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [imageStr, setImageStr] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImageStr(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startVoiceRecord = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Your browser does not support voice input.");
    const recognition = new SpeechRecognition();
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      setText((prev) => prev + " " + event.results[0][0].transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.start();
  };

  const submitIncident = async () => {
    if (!text && !imageStr) return setStatus('ERROR: Description or image required.');
    setStatus('TRANSMITTING ALERT TO DISPATCH...');
    try {
      const response = await fetch('http://localhost:8000/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: text, reported_location: location || 'Unknown', image_data: imageStr }),
      });
      if (response.ok) {
        setStatus('CODE RECEIVED: First responders are in route.');
        setText('');
        setImageStr(null);
      }
    } catch (error) {
      setStatus('TRANSMISSION FAILED: Cannot reach server.');
    }
  };

  const inputStyle = { width: '100%', padding: '14px', borderRadius: '6px', border: '1px solid #334155', backgroundColor: '#0F172A', color: '#F8FAFC', fontSize: '16px', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ backgroundColor: '#1E293B', padding: '40px', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
      <h2 style={{ marginTop: 0, color: '#F8FAFC', fontSize: '24px', marginBottom: '8px' }}>Emergency Transmitter</h2>
      <p style={{ color: '#94A3B8', marginBottom: '30px', fontSize: '14px' }}>Provide your location and situation. AI will automatically route your request.</p>
      
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#CBD5E1', fontSize: '14px', textTransform: 'uppercase' }}>Your Exact Location</label>
        <input placeholder="e.g. Room 302, Main Lobby" value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} />
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', color: '#CBD5E1', fontSize: '14px', textTransform: 'uppercase' }}>Situation Description</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <textarea placeholder="Type what is happening or tap the microphone..." value={text} onChange={e => setText(e.target.value)} style={{ ...inputStyle, height: '100px', resize: 'vertical' }} />
          <button 
            onClick={startVoiceRecord} 
            title="Dictate Message"
            style={{ 
              backgroundColor: isRecording ? '#EF4444' : '#334155', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', padding: '0 20px', fontSize: '24px', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
            {isRecording ? '🎙️' : '🎤'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '30px', backgroundColor: '#0F172A', padding: '20px', borderRadius: '6px', border: '1px dashed #475569' }}>
        <label style={{ fontWeight: '600', color: '#CBD5E1', fontSize: '14px', textTransform: 'uppercase' }}>Attach Visual Evidence (Optional)</label>
        <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} style={{ marginTop: '12px', display: 'block', color: '#94A3B8' }} />
        {imageStr && <img src={imageStr} alt="Preview" style={{ width: '100px', marginTop: '15px', borderRadius: '6px', border: '2px solid #334155' }} />}
      </div>

      <button 
        onClick={submitIncident} 
        style={{ 
          backgroundColor: '#EF4444', color: 'white', padding: '18px', border: 'none', borderRadius: '8px', width: '100%', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', transition: 'background 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#DC2626'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
      >
        Transmit SOS
      </button>
      
      {status && (
        <div style={{ marginTop: '20px', padding: '15px', borderRadius: '6px', backgroundColor: status.includes('ERROR') || status.includes('FAILED') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: `1px solid ${status.includes('ERROR') || status.includes('FAILED') ? '#EF4444' : '#10B981'}`, textAlign: 'center', fontWeight: 'bold', fontSize: '14px', color: status.includes('ERROR') || status.includes('FAILED') ? '#EF4444' : '#10B981' }}>
          {status}
        </div>
      )}
    </div>
  );
}

// --- STAFF CAD DASHBOARD (Computer-Aided Dispatch) ---
function StaffDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('All');

  const departments = ['All', 'Medical', 'Fire', 'Security', 'Natural Disaster'];

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/alerts');
    ws.onmessage = (event) => {
      const newAlert = JSON.parse(event.data);
      setAlerts(prev => [newAlert, ...prev]);
    };
    return () => ws.close();
  }, []);

  const filteredAlerts = alerts.filter(alert => 
    activeFilter === 'All' || alert.incident_category?.toLowerCase() === activeFilter.toLowerCase()
  );

  return (
    <div>
      {/* CAD Terminal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: '#F8FAFC', margin: '0 0 5px 0', fontSize: '24px' }}>Active Incident Board</h2>
          <p style={{ color: '#94A3B8', margin: 0, fontSize: '14px' }}>Awaiting WebSocket telemetry...</p>
        </div>
        
        {/* Department Filter Toggle */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {departments.map(dept => (
            <button 
              key={dept}
              onClick={() => setActiveFilter(dept)}
              style={{
                padding: '8px 16px', borderRadius: '4px', border: '1px solid', cursor: 'pointer', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', transition: 'all 0.2s',
                backgroundColor: activeFilter === dept ? getCategoryColor(dept) : '#1E293B',
                color: activeFilter === dept && dept !== 'All' ? '#FFFFFF' : '#94A3B8',
                borderColor: activeFilter === dept ? getCategoryColor(dept) : '#334155',
              }}>
              {dept} {dept === 'All' ? `[${alerts.length}]` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed */}
      {filteredAlerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', backgroundColor: '#1E293B', borderRadius: '8px', border: '1px dashed #334155' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>🛡️</div>
          <h3 style={{ color: '#10B981', fontSize: '20px', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>System Nominal</h3>
          <p style={{ color: '#64748B', margin: 0 }}>No active codes for {activeFilter === 'All' ? 'any department' : `the ${activeFilter} department`}.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {filteredAlerts.map((alert, index) => (
            <div key={index} style={{ 
              backgroundColor: '#1E293B', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', position: 'relative', display: 'flex', flexDirection: 'column'
            }}>
              {/* Left Color Bar indicating Severity */}
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: getSeverityColor(alert.severity_level) }}></div>
              
              {/* Card Header */}
              <div style={{ padding: '16px 20px 16px 26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', backgroundColor: '#0F172A' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getSeverityColor(alert.severity_level), boxShadow: `0 0 8px ${getSeverityColor(alert.severity_level)}` }}></div>
                  <strong style={{ color: getSeverityColor(alert.severity_level), fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                    {alert.severity_level} PRIORITY
                  </strong>
                </div>
                <span style={{ 
                  backgroundColor: getCategoryColor(alert.incident_category), color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                  {alert.incident_category}
                </span>
              </div>
              
              {/* Card Body */}
              <div style={{ padding: '20px 20px 20px 26px', flexGrow: 1 }}>
                <p style={{ margin: '0 0 15px 0', color: '#94A3B8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#F8FAFC' }}>📍 LOCATION:</span> {alert.location_extracted || 'Unknown'}
                </p>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#F8FAFC', lineHeight: '1.4', fontWeight: '500' }}>
                  "{alert.ai_standardized_summary}"
                </h3>
                
                {/* Meta Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                  <span style={{ backgroundColor: alert.weapons_or_hazards_present ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: alert.weapons_or_hazards_present ? '#EF4444' : '#10B981', padding: '6px 10px', borderRadius: '4px', border: `1px solid ${alert.weapons_or_hazards_present ? '#EF4444' : '#10B981'}` }}>
                    {alert.weapons_or_hazards_present ? '⚠️ HAZARD CONFIRMED' : '✅ AREA CLEAR'}
                  </span>
                  
                  {alert.requires_external_services && (
                    <span style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#F97316', padding: '6px 10px', borderRadius: '4px', border: '1px solid #F97316' }}>
                      📞 911 DISPATCHED
                    </span>
                  )}
                  
                  {alert.number_of_people_affected > 0 && (
                    <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', padding: '6px 10px', borderRadius: '4px', border: '1px solid #475569' }}>
                      👥 AFFECTED: {alert.number_of_people_affected}
                    </span>
                  )}

                  {/* New AI Confidence Badge */}
                  {alert.confidence_score !== undefined && (
                    <span style={{ backgroundColor: '#1E293B', color: '#94A3B8', padding: '6px 10px', borderRadius: '4px', border: '1px solid #475569' }}>
                      🤖 AI CONFIDENCE: {(alert.confidence_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}