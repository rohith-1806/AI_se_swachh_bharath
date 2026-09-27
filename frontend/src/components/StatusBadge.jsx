import React from 'react';
import { AlertCircle, Clock, Truck, CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ status }) {
  switch (status) {
    case 'NEW':
    case 'VERIFIED':
      return (
        <span className="badge badge-new">
          <AlertCircle size={12} />
          New Report
        </span>
      );
    case 'CLEANING_TEAM_ASSIGNED':
      return (
        <span className="badge badge-assigned">
          <Clock size={12} />
          Team Assigned
        </span>
      );
    case 'CLEANING_IN_PROGRESS':
      return (
        <span className="badge badge-progress">
          <Truck size={12} />
          Cleaning Active
        </span>
      );
    case 'RESOLVED':
      return (
        <span className="badge badge-resolved">
          <CheckCircle2 size={12} />
          Resolved
        </span>
      );
    case 'REJECTED':
      return (
        <span className="badge badge-rejected">
          <XCircle size={12} />
          Rejected
        </span>
      );
    default:
      return <span className="badge badge-rejected">{status}</span>;
  }
}
