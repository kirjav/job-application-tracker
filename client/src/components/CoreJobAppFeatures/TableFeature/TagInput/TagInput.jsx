import { useEffect, useRef, useState } from "react";
import API from "../../../../utils/api";
import "./TagInput.css";

const TagInput = ({ selectedTags = [], setSelectedTags = () => { } }) => {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await API.get("/tags", { withCredentials: true });
        setAvailableTags(res.data);
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    if (!input) {
      setSuggestions([]);
      return;
    }

    const filtered = availableTags.filter(
      (tag) =>
        tag.name.toLowerCase().startsWith(input.toLowerCase()) &&
        !selectedTags.some((t) => t.name === tag.name)
    );

    setSuggestions((prev) => {
      const prevNames = prev.map((tag) => tag.name).join(",");
      const newNames = filtered.map((tag) => tag.name).join(",");
      return prevNames === newNames ? prev : filtered;
    });
  }, [input, availableTags, selectedTags]);


  const handleAddTag = async (name) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    // Prevent duplicates
    if (selectedTags.some((tag) => tag.name === cleanName)) return;

    // Try to find existing tag
    const existing = availableTags.find((tag) => tag.name === cleanName);
    if (existing) {
      setSelectedTags([...selectedTags, existing]);
    } else {
      try {
        const res = await API.post("/tags", { name: cleanName });
        setAvailableTags([...availableTags, res.data]);
        setSelectedTags([...selectedTags, res.data]);
      } catch (err) {
        console.error("Failed to create tag:", err);
      }
    }

    setInput("");
    setSuggestions([]);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleAddTag(input);
    }
  };

  const handleRemoveTag = (id) => {
    setSelectedTags(selectedTags.filter((tag) => tag.id !== id));
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="tag-input-wrapper" ref={wrapperRef}>
      {selectedTags.map((tag) => (
        <div key={tag.id} className="tag-chip">
          {tag.name}
          <button type="button" onClick={() => handleRemoveTag(tag.id)} aria-label={`Remove ${tag.name}`}>
            ×
          </button>
        </div>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value.replace(/\s/g, ""))} // prevent spaces
        onKeyDown={handleInputKeyDown}
        placeholder="Add tag"
        aria-label="Add tag"
        aria-autocomplete="list"
        aria-controls={suggestions.length > 0 ? "tag-input-suggestions" : undefined}
      />
      {suggestions.length > 0 && (
        <ul className="tag-suggestions" id="tag-input-suggestions" role="listbox" aria-label="Tag suggestions">
          {suggestions.map((tag) => (
            <li key={tag.id} role="option" onClick={() => handleAddTag(tag.name)} tabIndex={-1}>
              {tag.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TagInput;
