import React, { useState, useEffect } from 'react';
import { getFileLocally, createFileUrl } from '../utils/localFileStore';
// This component parses a string and renders local files
const LocalContentRenderer = ({ content }) => {
const [renderedContent, setRenderedContent] = useState([]);

useEffect(() => {
    const parseContent = async () => {
        // Regex to find all our placeholders, e.g., [local-file:file_167888_photo.png]
        const parts = content.split(/(\[local-file:.*?\])/g);
        
        const processedParts = await Promise.all(
            parts.map(async (part, index) => {
                if (part.startsWith('[local-file:')) {
                    // Extract the fileId from the placeholder
                    const fileId = part.substring(12, part.length - 1);
                    const file = await getFileLocally(fileId);

                    if (file) {
                        const url = createFileUrl(file);
                        // Check if it's an image
                        if (file.type.startsWith('image/')) {
                            return <img key={index} src={url} alt={file.name} className="max-w-full h-auto rounded-lg my-4" />;
                        } else {
                            // Otherwise, it's a download link
                            return (
                                <a key={index} href={url} download={file.name} className="block my-4 p-4 bg-gray-100 rounded-lg hover:bg-gray-200">
                                    Download: {file.name}
                                </a>
                            );
                        }
                    }
                    return <p key={index} className="text-red-500">[File not found]</p>;
                } else {
                    // Regular text part, render it inside a <p> tag to preserve line breaks
                    return <p key={index}>{part}</p>;
                }
            })
        );
        setRenderedContent(processedParts);
    };

    if (content) {
        parseContent();
    }
}, [content]);

return <div>{renderedContent}</div>;
};
export default LocalContentRenderer;
