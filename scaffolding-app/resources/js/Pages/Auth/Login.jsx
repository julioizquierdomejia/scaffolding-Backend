import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import ADKLogo from '@/Components/ADKLogo';

export default function Login({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'));
    };

    return (
        <>
            <Head title="Log in" />

            {/* Full-screen background with city image and blue overlay */}
            <div className="relative min-h-screen flex items-center justify-center bg-[#f5f7fb]">
                {/* Background image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: 'url(/images/city-background.jpg)',
                    }}
                />

                {/* Blue overlay - matching Figma design */}
                <div className="absolute inset-0 bg-[rgba(30,58,138,0.4)]" />

                {/* Login Card with glassmorphism effect */}
                <div className="relative bg-[rgba(255,255,255,0.6)] backdrop-blur-sm rounded-xl shadow-[0px_1px_3px_0px_rgba(16,24,40,0.1),0px_1px_2px_0px_rgba(16,24,40,0.06)] px-10 py-8 w-full max-w-[440px] mx-4 flex flex-col gap-10">
                    {/* ADK Logo */}
                    <div className="flex justify-center">
                        <ADKLogo />
                    </div>

                    {/* Content wrapper */}
                    <div className="flex flex-col gap-6">
                        {/* Header Text */}
                        <div className="text-center flex flex-col gap-3">
                            <h1 className="font-manrope font-bold text-[30px] leading-[38px] text-[#252525]">
                                Enter your account
                            </h1>
                            <p className="font-manrope font-medium text-[16px] leading-[24px] text-[#252525]">
                                To sign in, enter your details
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="text-sm font-medium text-green-600 bg-green-50 p-3 rounded">
                                {status}
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={submit} className="flex flex-col gap-5">
                            {/* Email/Username Field */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="font-inter font-medium text-[14px] leading-[20px] text-[#252525]">
                                    Username
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Enter you username"
                                    className="w-full px-[14px] py-[10px] bg-white border border-[#cccdcf] rounded-lg font-inter font-normal text-[16px] leading-[24px] text-[#626262] placeholder:text-[#626262] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    autoComplete="username"
                                    autoFocus
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="font-inter font-medium text-[14px] leading-[20px] text-[#252525]">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter your password"
                                        className="w-full px-[14px] py-[10px] pr-12 bg-white border border-[#cccdcf] rounded-lg font-inter font-normal text-[16px] leading-[24px] text-[#626262] placeholder:text-[#626262] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4e4f56] hover:text-gray-700"
                                    >
                                        {showPassword ? (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center gap-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="w-4 h-4 bg-white text-blue-900 border border-[#9dafd4] rounded focus:ring-blue-500"
                                />
                                <label htmlFor="remember" className="font-inter font-medium text-[14px] leading-[20px] text-[#252525]">
                                    Remember me
                                </label>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-900 hover:bg-blue-950 border border-blue-900 text-white font-inter font-medium text-[14px] leading-[20px] px-[14px] py-[10px] rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Signing in...' : 'Enter'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
