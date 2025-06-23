
import {
    Tags,
    TagsContent,
    TagsEmpty,
    TagsGroup,
    TagsInput,
    TagsItem,
    TagsList,
    TagsTrigger,
    TagsValue,
  } from '@/components/ui/tagsfield';
  import { CheckIcon, PlusIcon } from 'lucide-react';
  import { useState } from 'react';
  import SkillBadge from './SkillBadge';


const SkillsEditor = ({ value, onChange, allSkills, onAddSkill = undefined, showOwnSkillsOption = false, className, children }) => {
    // const [selected, setSelected] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    // const [tags, setTags] = useState(defaultTags);

  const handleRemove = (evt, removedSkillId) => {
    evt.stopPropagation();
    const existingSkill = value.find((v) => v.id === removedSkillId);
    if (!existingSkill) {
      console.log(`Skill with id ${removedSkillId} not found in value.`);
      return;
    }
    console.log(`Removing skill with id: ${removedSkillId}`);
    onChange(value.filter((v) => v.id !== removedSkillId));
  };

  const handleSelect = (addedSkillId) => {
    const existingSkill = value.find((v) => v.id === addedSkillId);
    if (existingSkill) {
      console.log(`Skill with id ${addedSkillId} is already selected.`);
      return;
    }

    const newSkill = allSkills.find((skill) => skill.id === addedSkillId);
    if (!newSkill) {
      console.log(`Skill with id ${addedSkillId} not found in allSkills.`);
      return;
    }
    console.log(`Adding skill: ${newSkill.name} with id: ${addedSkillId}`);
    // Add the new skill to the value array
    onChange([...value, newSkill]);
  };

  const handleCreateTag = () => {
      console.log(`creating: ${searchTerm}`);
      onAddSkill(searchTerm);
      setSearchTerm('');
  };

  const filteredSkills = allSkills.filter((skill) =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase()) // Filter by search term
    && !value.some((s) => s.id === skill.id)                    // Exclude already selected skills
  );

    return (
      <Tags className="{className} flex flex-row items-center justify-end gap-2">
        <TagsTrigger>
          {value.map((skill) => (
              <SkillBadge key={skill.id} skill={skill} onClose={(evt) => handleRemove(evt, skill.id)} />
          ))}
          {children}
        </TagsTrigger>
        <TagsContent className="w-[300px] max-h-[50vh] overflow-y-auto flex flex-row flex-wrap gap-2">
          <TagsInput placeholder="Zoek skill..." onValueChange={setSearchTerm} />
          <TagsList>
            <TagsEmpty>
              {searchTerm.length > 0 ? (
                onAddSkill ?
                  `Geen zoekresultaat voor "${searchTerm}"`
                :
                  <button
                    type="button"
                    className="mx-auto flex cursor-pointer items-center gap-2"
                    onClick={handleCreateTag}
                  >
                    <PlusIcon size={14} className="text-muted-foreground" />
                    maak nieuwe skill: {searchTerm}
                  </button>
              ) : (
                <span className="mx-auto text-muted-foreground">De skills zijn op.</span>
              )}
            </TagsEmpty>
            <TagsGroup>
              {filteredSkills.map((skill) => (
                <TagsItem key={skill.id} value={skill.id} onSelect={handleSelect} className="justify-start">
                  {!value.some((s) => s.id === skill.id) && <SkillBadge skill={skill} /> }
                </TagsItem>
              ))}
            </TagsGroup>
          </TagsList>
        </TagsContent>
      </Tags>
    );
  };
  export default SkillsEditor;