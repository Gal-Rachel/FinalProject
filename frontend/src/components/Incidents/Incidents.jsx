import React, { useState, useEffect, useMemo } from 'react';
import { FaPlus, FaSearch, FaFilter, FaClock, FaCheckCircle, FaExclamationTriangle, FaUser, FaCalendar, FaBug, FaFireAlt, FaFlag, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import './Incidents.css';
import Select from 'react-select';

const Incidents = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/findings');
        if (!response.ok) {
          throw new Error('Failed to fetch findings');
        }
        const data = await response.json();
        setFindings(data.findings || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching findings:', error);
        setLoading(false);
      }
    };

    fetchFindings();
  }, []);

  // Convert findings to incidents with additional incident management data
  const incidents = useMemo(() => {
    return findings.map(finding => {
      // Generate incident data based on finding
      const severity = finding.Severity || 0;
      const isResolved = finding.Service?.Archived || false;
      
      // Determine incident status based on severity and resolution
      let status = 'open';
      let priority = 'medium';
      
      if (isResolved) {
        status = 'resolved';
      } else if (severity >= 8) {
        priority = 'critical';
        status = 'investigating';
      } else if (severity >= 6) {
        priority = 'high';
        status = 'investigating';
      } else if (severity >= 4) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      // Generate response time based on severity
      const responseTime = severity >= 8 ? '1 hour' : 
                          severity >= 6 ? '4 hours' : 
                          severity >= 4 ? '24 hours' : '72 hours';

      // Generate assignee based on threat type
      const threatType = finding.Type?.split(':')[0] || 'Other';
      let assignee = 'Security Team';
      if (threatType.includes('EC2')) {
        assignee = 'Cloud Security';
      } else if (threatType.includes('Network')) {
        assignee = 'Network Security';
      } else if (threatType.includes('IAM')) {
        assignee = 'Identity Team';
      }

      return {
        id: finding.Id,
        title: finding.Title,
        description: finding.Description,
        severity: severity,
        priority: priority,
        status: status,
        type: threatType,
        assignee: assignee,
        responseTime: responseTime,
        createdAt: finding.CreatedAt,
        updatedAt: finding.UpdatedAt,
        sourceIP: finding.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.IpAddressV4,
        sourceCountry: finding.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.Country?.CountryName,
        sourceOrg: finding.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.Organization?.Org,
        resourceId: finding.Resource?.InstanceDetails?.InstanceId || finding.Resource?.ResourceType,
        tags: finding.Resource?.InstanceDetails?.Tags || [],
        evidence: finding.Service?.Evidence,
        originalFinding: finding
      };
    });
  }, [findings]);

  // Filter incidents based on search and filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      const matchesSearch = incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           incident.assignee.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesSeverity = severityFilter === 'all' || incident.priority === severityFilter;
      
      return matchesSearch && matchesStatus && matchesSeverity;
    });
  }, [incidents, searchTerm, statusFilter, severityFilter]);

  // Incident statistics
  const incidentStats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter(i => i.status === 'open').length;
    const investigating = incidents.filter(i => i.status === 'investigating').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;
    const critical = incidents.filter(i => i.priority === 'critical').length;
    const high = incidents.filter(i => i.priority === 'high').length;

    return { total, open, investigating, resolved, critical, high };
  }, [incidents]);

  const handleStatusChange = (incidentId, newStatus) => {
    // In a real application, this would update the backend
    console.log(`Updating incident ${incidentId} to status: ${newStatus}`);
    // For now, we'll just show an alert
    alert(`Incident ${incidentId} status updated to: ${newStatus}`);
  };

  const handleAssignIncident = (incidentId, assignee) => {
    console.log(`Assigning incident ${incidentId} to: ${assignee}`);
    alert(`Incident ${incidentId} assigned to: ${assignee}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <FaClock className="status-icon open" />;
      case 'investigating': return <FaExclamationTriangle className="status-icon investigating" />;
      case 'resolved': return <FaCheckCircle className="status-icon resolved" />;
      default: return <FaClock className="status-icon" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#FFC107';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  if (loading) {
    return <div className="incidents-loading">Loading incidents...</div>;
  }

  return (
    <div className="incidents-container">
      <div className="incidents-header">
        <h1>Security Incidents</h1>
        <p>Manage and track security incidents and response activities</p>
      </div>

      {/* Incident Statistics */}
      <div className="incident-stats">
        <div className="stat-card">
          <span className="stat-icon stat-icon-bg" style={{ background: '#e3f7fa', color: '#36A2EB' }}><FaBug /></span>
          <h3>Total Incidents</h3>
          <div className="stat-value" style={{ color: '#36A2EB' }}>{incidentStats.total}</div>
        </div>
        <div className="stat-card open">
          <span className="stat-icon stat-icon-bg" style={{ background: '#fff4e3', color: '#FF9800' }}><FaClock /></span>
          <h3>Open</h3>
          <div className="stat-value" style={{ color: '#FF9800' }}>{incidentStats.open}</div>
        </div>
        <div className="stat-card investigating">
          <span className="stat-icon stat-icon-bg" style={{ background: '#fffbe3', color: '#FFC107' }}><FaExclamationTriangle /></span>
          <h3>Investigating</h3>
          <div className="stat-value" style={{ color: '#FFC107' }}>{incidentStats.investigating}</div>
        </div>
        <div className="stat-card resolved">
          <span className="stat-icon stat-icon-bg" style={{ background: '#e3fae7', color: '#4CAF50' }}><FaCheckCircle /></span>
          <h3>Resolved</h3>
          <div className="stat-value" style={{ color: '#4CAF50' }}>{incidentStats.resolved}</div>
        </div>
        <div className="stat-card critical">
          <span className="stat-icon stat-icon-bg" style={{ background: '#ffe3e3', color: '#F44336' }}><FaFireAlt /></span>
          <h3>Critical</h3>
          <div className="stat-value" style={{ color: '#F44336' }}>{incidentStats.critical}</div>
        </div>
        <div className="stat-card high">
          <span className="stat-icon stat-icon-bg" style={{ background: '#f3e3ff', color: '#9966FF' }}><FaFlag /></span>
          <h3>High Priority</h3>
          <div className="stat-value" style={{ color: '#9966FF' }}>{incidentStats.high}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="incident-controls">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <Select
            classNamePrefix="custom-select"
            value={{ value: statusFilter, label: statusFilter === 'all' ? 'All Status' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) }}
            onChange={option => setStatusFilter(option.value)}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'investigating', label: 'Investigating' },
              { value: 'resolved', label: 'Resolved' }
            ]}
            styles={{ container: base => ({ ...base, minWidth: 160, marginRight: 8 }) }}
            isSearchable={false}
          />
          <Select
            classNamePrefix="custom-select"
            value={{ value: severityFilter, label: severityFilter === 'all' ? 'All Priority' : severityFilter.charAt(0).toUpperCase() + severityFilter.slice(1) }}
            onChange={option => setSeverityFilter(option.value)}
            options={[
              { value: 'all', label: 'All Priority' },
              { value: 'critical', label: 'Critical' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' }
            ]}
            styles={{ container: base => ({ ...base, minWidth: 160 }) }}
            isSearchable={false}
          />
        </div>
      </div>

      {/* Incidents List */}
      <div className="incidents-list">
        {filteredIncidents.map((incident) => (
          <div key={incident.id} className="incident-card" onClick={() => setSelectedIncident(incident)}>
            <div className="incident-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, borderBottom: '1px solid #f0f0f0', paddingBottom: 10, marginBottom: 18 }}>
              <div className="incident-status" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: '2.1rem', display: 'flex', alignItems: 'center', color: incident.status === 'open' ? '#FF9800' : incident.status === 'investigating' ? '#FFC107' : incident.status === 'resolved' ? '#4CAF50' : '#36A2EB' }}>
                  {getStatusIcon(incident.status)}
                </span>
                <span className="status-text" style={{ marginLeft: 10, fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize', letterSpacing: 0.2 }}>{incident.status}</span>
              </div>
              <div className="incident-priority" style={{ backgroundColor: getPriorityColor(incident.priority), marginLeft: 'auto', minWidth: 90, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                {incident.priority}
              </div>
            </div>
            
            <div className="incident-content">
              <h3 className="incident-title">{incident.title}</h3>
              <p className="incident-description">{incident.description}</p>
              
              <div className="incident-meta">
                <div className="meta-item">
                  <FaUser className="meta-icon" />
                  <span>{incident.assignee}</span>
                </div>
                <div className="meta-item">
                  <FaClock className="meta-icon" />
                  <span>Response: {incident.responseTime}</span>
                </div>
                <div className="meta-item">
                  <FaCalendar className="meta-icon" />
                  <span>{new Date(incident.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              <div className="incident-details">
                <div className="detail-item">
                  <strong>Type:</strong> {incident.type}
                </div>
                {incident.sourceIP && (
                  <div className="detail-item">
                    <strong>Source IP:</strong> {incident.sourceIP}
                  </div>
                )}
                {incident.sourceCountry && (
                  <div className="detail-item">
                    <strong>Location:</strong> {incident.sourceCountry}
                  </div>
                )}
                {incident.resourceId && (
                  <div className="detail-item">
                    <strong>Resource:</strong> {incident.resourceId}
                  </div>
                )}
              </div>
            </div>
            
            <div className="incident-actions">
              <button 
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStatusChange(incident.id, 'investigating');
                }}
              >
                Start Investigation
              </button>
              <button 
                className="btn btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAssignIncident(incident.id, 'Security Analyst');
                }}
              >
                Reassign
              </button>
            </div>
          </div>
        ))}
        
        {filteredIncidents.length === 0 && (
          <div className="no-incidents">
            <p>No incidents found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <div className="incident-modal" onClick={() => setSelectedIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedIncident.title}</h2>
              <button className="btn-close" onClick={() => setSelectedIncident(null)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-section">
                <h3>Incident Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Status:</strong> {selectedIncident.status}
                  </div>
                  <div className="detail-item">
                    <strong>Priority:</strong> {selectedIncident.priority}
                  </div>
                  <div className="detail-item">
                    <strong>Type:</strong> {selectedIncident.type}
                  </div>
                  <div className="detail-item">
                    <strong>Assignee:</strong> {selectedIncident.assignee}
                  </div>
                  <div className="detail-item">
                    <strong>Response Time:</strong> {selectedIncident.responseTime}
                  </div>
                  <div className="detail-item">
                    <strong>Created:</strong> {new Date(selectedIncident.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="modal-section">
                <h3>Description</h3>
                <p>{selectedIncident.description}</p>
              </div>
              
              {selectedIncident.sourceIP && (
                <div className="modal-section">
                  <h3>Threat Intelligence</h3>
                  <div className="threat-info">
                    <div><strong>Source IP:</strong> {selectedIncident.sourceIP}</div>
                    {selectedIncident.sourceCountry && (
                      <div><strong>Country:</strong> {selectedIncident.sourceCountry}</div>
                    )}
                    {selectedIncident.sourceOrg && (
                      <div><strong>Organization:</strong> {selectedIncident.sourceOrg}</div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="modal-section">
                <h3>Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStatusChange(selectedIncident.id, 'investigating')}
                  >
                    Start Investigation
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleStatusChange(selectedIncident.id, 'resolved')}
                  >
                    Mark Resolved
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => handleAssignIncident(selectedIncident.id, 'Security Analyst')}
                  >
                    Reassign
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Incidents; 