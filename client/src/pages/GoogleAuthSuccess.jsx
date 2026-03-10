import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchUser } from '../store/user/authSlice';
import { refreshUserToken } from '../api/user/user.api';

const GoogleAuthSuccess = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const finalizeAuth = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 500));
                try {
                    await refreshUserToken();
                } catch (e) {
                }

                await dispatch(fetchUser()).unwrap();
                navigate('/', { replace: true });
            } catch (err) {
                console.error("Google Sync Failed:", err);
                navigate('/login?error=sync_failed', { replace: true });
            }
        };
        finalizeAuth();
    }, [dispatch, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-[#7a6af6] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Syncing Profile...</p>
            </div>
        </div>
    );
};

export default GoogleAuthSuccess;