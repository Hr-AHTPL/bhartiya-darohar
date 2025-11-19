import { Toaster } from "@/components/ui/sonner";
import { Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react'
import { handleError, handleSuccess } from '@/utils';
import { Heart, Lock, Mail, User, Sparkles } from 'lucide-react';
import API_BASE_URL from "@/config/api.config";

function Signup() {
    const [signupInfo, setSignupInfo] = useState({
        name: '',
        email: '',
        password: ''
    })
    const navigate = useNavigate();
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const copySignupInfo = { ...signupInfo };
        copySignupInfo[name as keyof typeof signupInfo] = value;
        setSignupInfo(copySignupInfo)
    }
    
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        const { name, email, password } = signupInfo;
        if (!name || !email || !password) {
            return handleError('Name, Email & Password are required')
        }
        try {
            const url = `${API_BASE_URL}/auth/signup`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(signupInfo)
            })
            const result = await response.json();
            const { success, message, error } = result;
            if (success) {
                handleSuccess(message);
                setTimeout(() => {
                    navigate('/login')
                }, 1000);
            } else if (error) {
                const details = error?.details[0].message
                handleError(details);
            } else if (!success) {
                handleError(message);
            }
        } catch (err) {
            handleError(err as string)
        }
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50/80 to-amber-100/90 relative overflow-hidden flex items-center justify-center px-4">
            {/* Floating Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-amber-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-orange-400/10 to-red-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo and Brand Section */}
                <div className="text-center mb-8 space-y-4">
                    <div className="flex items-center justify-center space-x-4 mb-6">
                        <img
                            src="/icon2.png"
                            alt="Therapy Icon"
                            className="h-16 w-16 object-contain drop-shadow-lg animate-pulse"
                        />
                        <img
                            src="/BD1w.png"
                            alt="BHARTIYA DAROHAR"
                            className="h-10 object-contain"
                        />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black bg-gradient-to-r from-orange-700 via-red-700 to-amber-700 bg-clip-text text-transparent">
                            Join Our Family
                        </h1>
                        <p className="text-orange-600 font-semibold flex items-center justify-center space-x-2">
                            {/* <Heart className="h-4 w-4 text-red-500 animate-pulse" /> */}
                            <span>आयुर्वेद, हर द्वार</span>
                            {/* <Heart className="h-4 w-4 text-red-500 animate-pulse" /> */}
                        </p>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl border-2 border-white/30 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
                    {/* Decorative gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-red-50/50 to-amber-50/50 rounded-3xl"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-bl-full"></div>
                    
                    <div className="relative z-10">
                        <form onSubmit={handleSignup} className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="block text-sm font-bold text-gray-700 flex items-center space-x-2">
                                    <User className="h-4 w-4 text-orange-600" />
                                    <span>Full Name</span>
                                </label>
                                <input
                                    onChange={handleChange}
                                    type="text"
                                    name="name"
                                    id="name"
                                    autoFocus
                                    placeholder="Enter your full name..."
                                    value={signupInfo.name}
                                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm font-medium placeholder:text-gray-400 hover:border-orange-300"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-bold text-gray-700 flex items-center space-x-2">
                                    <Mail className="h-4 w-4 text-orange-600" />
                                    <span>Email Address</span>
                                </label>
                                <input
                                    onChange={handleChange}
                                    type="email"
                                    name="email"
                                    id="email"
                                    placeholder="Enter your email..."
                                    value={signupInfo.email}
                                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm font-medium placeholder:text-gray-400 hover:border-orange-300"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-bold text-gray-700 flex items-center space-x-2">
                                    <Lock className="h-4 w-4 text-orange-600" />
                                    <span>Password</span>
                                </label>
                                <input
                                    onChange={handleChange}
                                    type="password"
                                    name="password"
                                    id="password"
                                    placeholder="Create a secure password..."
                                    value={signupInfo.password}
                                    className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-300 bg-white/70 backdrop-blur-sm font-medium placeholder:text-gray-400 hover:border-orange-300"
                                />
                            </div>
                            
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 hover:from-orange-700 hover:via-red-700 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-xl hover:shadow-2xl hover:scale-105 transition-all duration-500 text-lg relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <span className="relative flex items-center justify-center space-x-2">
                                    <span>Create Account</span>
                                    <Heart className="h-5 w-5 animate-pulse" />
                                </span>
                            </button>
                            
                            <div className="text-center pt-4">
                                <span className="text-gray-600 font-medium">
                                    Already part of our community?{' '}
                                    <Link
                                        to="/login"
                                        className="text-orange-600 hover:text-red-600 font-bold transition-colors duration-300 relative group"
                                    >
                                        <span className="relative">
                                            Sign In
                                            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-600 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                                        </span>
                                    </Link>
                                </span>
                            </div>
                        </form>
                    </div>
                </div>
                
                {/* Footer text */}
                {/* <div className="text-center mt-6 space-y-2">
                    <p className="text-sm text-gray-600 font-medium flex items-center justify-center space-x-2">
                        <Sparkles className="h-4 w-4 text-orange-500 animate-spin" />
                        <span>Where ancient wisdom meets modern healthcare</span>
                        <Sparkles className="h-4 w-4 text-orange-500 animate-spin" />
                    </p>
                </div> */}
            </div>
            <Toaster />
        </div>
    )
}

export default Signup