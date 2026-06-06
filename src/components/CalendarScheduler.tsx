import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  fetchCalendarEvents, 
  CalendarEvent 
} from "../firebase_client";
import { 
  Calendar, 
  Users, 
  Clock, 
  LogOut, 
  RefreshCw, 
  AlertCircle, 
  ShieldCheck, 
  ExternalLink,
  Play
} from "lucide-react";

interface CalendarSchedulerProps {
  onJoinMeeting: (event: CalendarEvent) => void;
}

export default function CalendarScheduler({ onJoinMeeting }: CalendarSchedulerProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Auth listeners and restore tokens if cached
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setIsAuthLoading(false);
        loadSchedules(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await loadSchedules(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to authenticate with Google. Ensure popups are allowed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await logout();
      setUser(null);
      setToken(null);
      setEvents([]);
    } catch (err: any) {
      setError("Failed to sign out clean.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async (accessToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetched = await fetchCalendarEvents(accessToken);
      setEvents(fetched);
    } catch (err: any) {
      console.error(err);
      setError("Unable to sync Google Calendar schedules. Check access permissions or retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (token) {
      loadSchedules(token);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    if (!event.start.dateTime) return "All Day event";
    const startObj = new Date(event.start.dateTime);
    const endObj = event.end.dateTime ? new Date(event.end.dateTime) : null;

    const timeString = startObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const dateString = startObj.toLocaleDateString([], { month: "short", day: "numeric" });
    
    if (endObj) {
      const endTimeString = endObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return `${dateString} • ${timeString} - ${endTimeString}`;
    }
    return `${dateString} • ${timeString}`;
  };

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 gap-2">
        <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
        <span className="text-xs text-zinc-400 font-mono">Restoring Calendar sync...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in p-1">
      {/* Auth Gate Header */}
      {!user ? (
        <div className="flex flex-col items-center text-center p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900 gap-4">
          <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center shadow-inner">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 leading-normal">Connect Your Schedule</span>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
              Syncing with Google Calendar automatically pulls your today's events, Google Meet details, and attendee lists so TranscriptAI can join instantly.
            </p>
          </div>

          {/* Styled GSI button */}
          <button 
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-sm text-sm font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-750 transition-all select-none disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4 shrink-0" version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
            )}
            Sign in with Google
          </button>
        </div>
      ) : (
        /* Connected Calendar view */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || "user"} className="h-7 w-7 rounded-full border border-indigo-200 dark:border-indigo-800" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-7 w-7 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs">
                  {user.displayName?.slice(0, 1) || "U"}
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 leading-none">{user.displayName || user.email}</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5 font-medium">
                  <ShieldCheck className="h-3 w-3 text-indigo-500" /> Schedules Connected
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleRefresh}
                title="Refresh events"
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleSignOut}
                title="Disconnect"
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-550 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Event Listing */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Today's Scheduled Meetings</span>
            
            {isLoading && events.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs">Syncing with calendar primary feed...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/20 dark:bg-zinc-900/10">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 font-sans">No upcoming events found</p>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 block">Add calendar items to your Google account with Meet coordinates.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                {events.map((event) => {
                  const hasMeet = !!event.hangoutLink;
                  return (
                    <div
                      key={event.id}
                      className="group p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-150 dark:hover:border-indigo-900 rounded-xl transition-all duration-200 flex flex-col gap-2.5 shadow-xs"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <h4 className="text-xs font-bold text-zinc-950 dark:text-zinc-50 truncate max-w-[190px] leading-tight">
                            {event.summary || "Untitled Meeting"}
                          </h4>
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-550 font-medium flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatEventTime(event)}
                          </span>
                        </div>

                        {hasMeet && (
                          <a
                            href={event.hangoutLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg shrink-0 flex items-center justify-center gap-1 text-[10px] font-bold"
                          >
                            Meet <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {/* Display active participants */}
                      {event.attendees && event.attendees.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {event.attendees.slice(0, 3).map((attendee, attIdx) => (
                            <span
                              key={attIdx}
                              className="text-[9px] bg-zinc-105 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 rounded-md px-1 py-0.5 text-zinc-600 dark:text-zinc-300 truncate max-w-[100px]"
                              title={attendee.email}
                            >
                              {attendee.displayName || attendee.email.split("@")[0]}
                            </span>
                          ))}
                          {event.attendees.length > 3 && (
                            <span className="text-[9px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md px-1 py-0.5">
                              +{event.attendees.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Join Meeting Room Control */}
                      <button
                        onClick={() => onJoinMeeting(event)}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-705 text-white font-bold text-xs rounded-lg transition-all shadow-xs group-hover:scale-[1.01]"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        Join as TranscriptAI Assistant
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-150 rounded-lg text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-650" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}
    </div>
  );
}
