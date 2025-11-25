import type { User, Employee, DJ } from './types';

export const users: User[] = [
  { id: 'usr1', name: 'Alice Johnson', email: 'alice.j@example.com', avatar: '1', role: 'Admin', joinDate: '2023-01-15' },
  { id: 'usr2', name: 'Bob Williams', email: 'bob.w@example.com', avatar: '2', role: 'Member', joinDate: '2023-02-20' },
  { id: 'usr3', name: 'Charlie Brown', email: 'charlie.b@example.com', avatar: '3', role: 'Member', joinDate: '2023-03-10' },
  { id: 'usr4', name: 'Diana Miller', email: 'diana.m@example.com', avatar: '4', role: 'Guest', joinDate: '2023-05-01' },
  { id: 'usr5', name: 'Ethan Davis', email: 'ethan.d@example.com', avatar: '5', role: 'Member', joinDate: '2023-06-18' },
];

export const employees: Employee[] = [
  { id: 'emp1', name: 'Frank White', email: 'frank.w@work.com', avatar: '11', department: 'Engineering', jobTitle: 'Senior Developer', startDate: '2022-08-01' },
  { id: 'emp2', name: 'Grace Green', email: 'grace.g@work.com', avatar: '12', department: 'Marketing', jobTitle: 'Marketing Manager', startDate: '2021-11-15' },
  { id: 'emp3', name: 'Henry Black', email: 'henry.b@work.com', avatar: '13', department: 'Human Resources', jobTitle: 'HR Specialist', startDate: '2023-04-01' },
  { id: 'emp4', name: 'Ivy Hall', email: 'ivy.h@work.com', avatar: '14', department: 'Sales', jobTitle: 'Sales Representative', startDate: '2023-07-22' },
  { id: 'emp5', name: 'Jack King', email: 'jack.k@work.com', avatar: '15', department: 'Engineering', jobTitle: 'UI/UX Designer', startDate: '2022-10-10' },
];

export const djs: DJ[] = [
  { id: 'dj1', stageName: 'DJ Spark', realName: 'Liam Smith', avatar: '21', genres: 'EDM, Progressive House', bookingContact: 'spark@bookings.com', performanceCount: 150 },
  { id: 'dj2', stageName: 'MC Flow', realName: 'Olivia Chen', avatar: '22', genres: 'Hip Hop, R&B', bookingContact: 'mcflow@bookings.com', performanceCount: 200 },
  { id: 'dj3', stageName: 'Vinyl Vibe', realName: 'Noah Taylor', avatar: '23', genres: 'Funk, Soul, Disco', bookingContact: 'vibe@bookings.com', performanceCount: 300 },
  { id: 'dj4', stageName: 'Bass Queen', realName: 'Emma Jones', avatar: '24', genres: 'Dubstep, Drum & Bass', bookingContact: 'bassq@bookings.com', performanceCount: 120 },
  { id: 'dj5', stageName: 'Techno Titan', realName: 'William Garcia', avatar: '25', genres: 'Techno, Acid House', bookingContact: 'titan@bookings.com', performanceCount: 250 },
];
