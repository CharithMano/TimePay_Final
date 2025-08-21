import React from 'react';
import { useParams } from 'react-router-dom';

const EmployeeProfile = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Employee Profile</h1>
      <p>Employee ID: {id}</p>
    </div>
  );
};

export default EmployeeProfile;