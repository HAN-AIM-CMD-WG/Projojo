import { useEffect, useState } from "react";
import { createSkill, getUser } from "../services";
import { useAuth } from "./AuthProvider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import SkillBadge from "./SkillBadge";
import { Badge } from "./ui/badge";


export default function SkillsEditor({ value, onChange, allSkills, isAllowedToAddSkill = false, showOwnSkillsOption = false, children }) {

    const { authData } = useAuth();

    return (
        <>
        { value.map(skill => (
            <Badge
                key={skill.skillId}
                skillName={skill.name}
                isPending={skill.isPending}
            />
        ))}
        <Popover>
            <PopoverTrigger className="">
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-full max-h-[50vh] overflow-y-auto">
                <div className="flex flex-col gap-2">
                    {allSkills.map(skill => (
                        <div key={skill.id} onClick={() => onChange([...value, skill])} className="flex items-center justify-between p-2 hover:bg-gray-200">
                            <span>{skill.name}</span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
         </>
    );
}