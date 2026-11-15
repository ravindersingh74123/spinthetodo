"use client";

import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import Wheel from "@/components/Wheel";
import ActiveTask from "@/components/ActiveTask";
import StatsBar from "@/components/StatsBar";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Stats Bar (Phase 6) */}
      <StatsBar />

      {/* Main App Grid: Restructured Responsive 3-Zone Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left Wing: Task Creation Station */}
        <div className="md:col-span-1 xl:col-span-4 order-2 xl:order-1 flex flex-col gap-6">
          <TaskForm />
        </div>

        {/* Center Stage: The Wheel Arena & Active Momentum Timer */}
        <div className="md:col-span-2 xl:col-span-4 order-1 xl:order-2 flex flex-col items-center gap-6">
          <Wheel />
          <ActiveTask />
        </div>

        {/* Right Wing: Today's Missions Roster & Daily Progress */}
        <div className="md:col-span-1 xl:col-span-4 order-3 xl:order-3 flex flex-col gap-6">
          <TaskList />
        </div>
      </div>
    </div>
  );
}
