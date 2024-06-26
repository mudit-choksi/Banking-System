import React, { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import axios from "axios";
import {Navbar} from "../../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/Footer";

export const LoginPage = () => { 
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const { login } = useAuth();

    const [inputValue, setInputValue] = useState({
        email: "",
        password: ""
    });

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setInputValue({
        ...inputValue,
        [name]: value,
        });
    };

    const routeAsPerRole = async (userRole) => {  
        let path = "/login";
        switch (userRole) {
          case 'customer':
            path = "/user"
            break
          case 'merchant':
            path = "/user" 
            break
          default:
            path = "/admin"
        }
        setTimeout(() => {
          navigate(path, {replace:true});
        }, 1000);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const url = "https://156.56.103.231:8080/login";
        try {
            const response = await axios.post(url, inputValue);

            await login({
              email: response.data.email,
              role: response.data.role,
              token: response.data.token,
            });
            routeAsPerRole(response.data.role);
        } catch (err) {
          console.log(err.response);
        if (err.response && err.response.status === 401) {
            // Handle 401 Unauthorized error
            setError('Unauthorized. Please Sign up.');
        } else {
            // Handle other errors
            setError('An error occurred while processing your request.');
        }
        }
    };

  return (
    <>
        <Navbar/>
        <div className="min-h-screen max-w-7xl w-full mx-auto flex justify-center items-center flex-col lg:flex-row gap-4 p-4 md:p-10">
              <div class="px-6 py-12 text-center md:px-12 lg:py-24 lg:text-left">
            <div class="w-100 mx-auto text-neutral-800 sm:max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-7xl">
              <div class="grid items-center gap-12 lg:grid-cols-2">
                <div class="mt-12 lg:mt-0 z-index: 10">
                  <h1 class="mt-0 mb-16 text-5xl font-bold tracking-tight md:text-6xl xl:text-7xl text-[hsl(218,81%,95%)]">
                      Enhance  <br /><span class="text-[hsl(218,81%,75%)]">your banking experience</span>
                  </h1>

                  <p className="text-slate-100 !font-sans text-sm md:text-base lg:text-lg leading-5 my-5 drop-shadow">
                      Bring your finances into the online world! 
                      With your SBS account,you've got everything 
                      you need in one convenient spot.
                  </p>
                </div>
                <div class="relative mb-12 lg:mb-0">
                  <div id="radius-shape-1" class="absolute rounded-full shadow-lg"></div>
                  <div id="radius-shape-2" class="absolute shadow-lg"></div>
                  <div
                    class="relative backdrop-blur-[25px] backdrop-saturate-[200%] block rounded-lg px-6 py-12  dark:bg-[hsla(0,0%,15%,0.9)] dark:shadow-black/20 md:px-12">
                    <form>
                      <label class="block">
                        <span class="block text-sm font-medium text-slate-100">Email</span>
                        <input type="email" required value={inputValue.email} name="email" onChange={handleOnChange} class="peer ... py-2 px-2 ps-2 block w-full border-gray-100 shadow-sm rounded-lg text-sm focus:z-10 focus:border-slate-300 focus:ring-slate-300 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-300 dark:border-gray-300 dark:text-gray-900 dark:focus:ring-gray-300" placeholder="you@site.com"/> 
                      </label>
                      
                      <br/>
                      <div class="relative mb-6" data-te-input-wrapper-init>
                        <label class="block">
                          <span class="block text-sm font-medium text-slate-100">Password</span>
                          {/* <input type="password"  name={password} onChange={handleOnChange} value={password} className="py-2 px-2 ps-2 block w-full border-gray-100 shadow-sm rounded-lg text-sm focus:z-10 focus:border-slate-300 focus:ring-slate-300 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-300 dark:border-gray-300 dark:text-gray-900 dark:focus:ring-gray-300"/> */}
                          <input
                            type="password"
                            name="password"
                            className="py-2 px-2 ps-2 block w-full border-gray-100 shadow-sm rounded-lg text-sm focus:z-10 focus:border-slate-300 focus:ring-slate-300 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-300 dark:border-gray-300 dark:text-gray-900 dark:focus:ring-gray-300"
                            value={inputValue.password}
                            onChange={handleOnChange}
                            placeholder="Enter Your Password"
                            required
                          />
                        </label>
                        <br/>
                      </div>
                      <button type="button" data-te-ripple-init data-te-ripple-color="light" onClick={handleLogin}
                        class="mb-6 inline-block w-full rounded bg-[hsl(143,74%,45%)] px-6 pt-2.5 pb-2 text-xs font-medium uppercase leading-normal text-white shadow-[0_4px_9px_-4px_#3b71ca] transition duration-150 ease-in-out hover:bg-[hsl(218,81%,75%)] hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.3),0_4px_18px_0_rgba(59,113,202,0.2)] dark:shadow-[0_4px_9px_-4px_rgba(59,113,202,0.5)] dark:hover:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:focus:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)] dark:active:shadow-[0_8px_9px_-4px_rgba(59,113,202,0.2),0_4px_18px_0_rgba(59,113,202,0.1)]">
                        Login
                      </button>
                      {error && <p class="mt-2 text-pink-600 text-sm">Error: {error}</p>}
                      <p className="text-slate-200 mt-6 text-center">
                        Not a Client?{" "}
                        <Link
                          to="/register"
                          className="mx-2 text-blue-400 hover:text-blue-600 focus:text-blue-100 transition duration-100 ease-in-out"
                        >
                          Register
                        </Link>
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer/>
    </>
  )
}
