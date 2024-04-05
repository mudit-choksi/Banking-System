import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import InternalEditProfileFields from './InternalEditProfileFields'; // Adjust the path as needed

const InternalProfilePage = () => {
    const [userData, setUserData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [role, setRole] = useState(null); // Define role state
    const navigate = useNavigate(); 
  
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const roleFromCookie = Cookies.get('role');
                if (!roleFromCookie) {
                  console.error("Role not found in cookie");
                  navigate("/login");
                  return;
                }
                setRole(roleFromCookie); // Set role state
                const token = Cookies.get('token');
                if (token) {
                  const response = await axios.get('http://localhost:8080/'+ roleFromCookie +'/profile', {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  });
                  setUserData(response.data);
                  console.log("User data:", response.data);
                } else {
                  console.error("Token not found in cookie");
                  navigate("/login");          
                }
              } catch (error) {
                console.error("Error fetching user data:", error);
              }
            };
            fetchUserData();
          }, [navigate]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async (updatedUserData) => {
        // Send updated user data to the backend
        try {
            const token = Cookies.get('token');
            if (token) {
                await axios.put('http://localhost:8080/'+ role +'/profile', updatedUserData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                console.log()
                // Update local state with new user data
                setUserData(updatedUserData);
                setIsEditing(false);
                console.log("Profile updated successfully!");
            } else {
                console.error("Token not found in cookie");
                navigate("/login");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    
    const extractDate = (datetimeString) => {
        if (!datetimeString) return null; // Return null if datetimeString is null or empty
    
        const date = new Date(datetimeString);
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            console.error("Invalid datetime string:", datetimeString);
            return null;
        }
        
        // Get the date part in yyyy-mm-dd format
        return date.toISOString().split('T')[0];
    };
    

    const formattedDate = userData ? extractDate(userData.dob) : null;

    return (
        <div className="container mx-auto py-8">
            {isEditing ? (
                <InternalEditProfileFields 
                    userData={userData} 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                    date = {formattedDate}
                />
            ) : (
                <div className="max-w block p-6 rounded shadow-lg shadow-black/20 bg-gray-800 mx-auto">
                    <div className="p-6">
                        <h3 className="flex justify-center items-center text-2xl text-blue-600 font-bold text-center p-2 my-4 rounded shadow bg-blue-200 border-x-4 select-none">
                            <span>Your Profile</span>
                        </h3>
                        {userData && (
                            <div>
                                <p className='text-slate-100'><strong>User Name:</strong> {userData.user_name}</p>
                                <p className='text-slate-100'><strong>Email:</strong> {userData.email}</p>
                                {formattedDate && <p className='text-slate-100'><strong>Date of Birth:</strong>{formattedDate}</p>}
                                <p className='text-slate-100'><strong>Mobile Number:</strong> {userData.phone_number}</p>
                                <p className='text-slate-100'><strong>Address:</strong> {userData.address}</p>
                               
                             
                             
                                
                            </div>
                        )}
                        <div className="flex justify-center mt-4">
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={handleEdit}>Update Profile</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InternalProfilePage;