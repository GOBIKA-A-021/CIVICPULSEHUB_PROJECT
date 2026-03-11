// Department and Designation Configuration
export const departmentsConfig = {
  ROADS: {
    name: 'Roads & Infrastructure',
    designations: ['Field Specialist', 'Senior Inspector', 'Maintenance Supervisor', 'Engineering Technician']
  },
  WATER: {
    name: 'Water Supply',
    designations: ['Water Inspector', 'Pipe Technician', 'Meter Reader', 'Maintenance Supervisor']
  },
  ELECTRICITY: {
    name: 'Electricity & Power',
    designations: ['Electrical Inspector', 'Lineman', 'Meter Technician', 'Safety Officer']
  },
  SANITATION: {
    name: 'Sanitation & Waste',
    designations: ['Sanitation Inspector', 'Waste Collector Supervisor', 'Health Officer', 'Cleanliness Monitor']
  },
  PUBLIC_SAFETY: {
    name: 'Public Safety',
    designations: ['Safety Officer', 'Traffic Inspector', 'Public Health Officer', 'Community Liaison']
  },
  HEALTH: {
    name: 'Health & Welfare',
    designations: ['Health Inspector', 'Medical Officer', 'Welfare Officer', 'Public Health Inspector']
  },
  PARKS: {
    name: 'Parks & Recreation',
    designations: ['Park Supervisor', 'Grounds Maintenance Officer', 'Recreation Coordinator', 'Facility Manager']
  },
  EDUCATION: {
    name: 'Education & Community',
    designations: ['Community Officer', 'Education Liaison', 'Program Coordinator', 'Outreach Officer']
  }
};

export const categoryDepartmentMap = {
  'Roads': 'ROADS',
  'Potholes': 'ROADS',
  'Street Light': 'ELECTRICITY',
  'Water Supply': 'WATER',
  'Water Pipe': 'WATER',
  'Electricity': 'ELECTRICITY',
  'Power Outage': 'ELECTRICITY',
  'Garbage': 'SANITATION',
  'Sanitation': 'SANITATION',
  'Public Safety': 'PUBLIC_SAFETY',
  'Health': 'HEALTH',
  'Parks': 'PARKS',
  'Education': 'EDUCATION'
};

export const getDepartmentsDropdown = () => {
  return Object.entries(departmentsConfig).map(([key, value]) => ({
    value: key,
    label: value.name,
    name: value.name
  }));
};

export const getDesignationsByDepartment = (departmentKey) => {
  const dept = departmentsConfig[departmentKey];
  return dept ? dept.designations : [];
};
