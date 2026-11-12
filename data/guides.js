export const guides = [
  {
    slug: "compress-images-without-losing-quality",
    title: "How to Compress Images Without Losing Too Much Quality",
    description: "Choose a sensible image quality, compare the result at its intended size, and keep the source when compression does not help.",
    tag: "Image workflow",
    intro: "Smaller image files are useful for sharing and storage, but aggressive compression can make edges and fine detail look rough. A quick visual comparison is more useful than aiming for a fixed reduction percentage.",
    steps: [
      ["Start with a copy", "Keep the original file unchanged. This gives you a way back if the compressed version looks poor or you later need a different size."],
      ["Choose an output format", "JPEG and WebP use adjustable quality settings. PNG is a better fit when sharp edges or transparency matter; ToolNest attempts PNG optimization and keeps the original if it cannot produce a smaller valid file."],
      ["Compare at the size people will see", "Look at text, hair, gradients and edges at the image's expected display size. A tiny preview can hide artifacts that become obvious when enlarged."],
      ["Keep the smaller useful result", "ToolNest compares encoded sizes for JPEG and WebP and retains the original if no candidate is smaller. The amount saved depends on the source image and selected quality."],
    ],
    example: "For a product photo that will appear around 800 pixels wide, compare the output at that size. If a transparent logo develops a background or its edges look rough, keep the PNG source instead of forcing another format.",
    limitations: "Compression cannot restore detail already lost in a source image. JPEG does not support transparency; when converting a transparent image to JPEG, select a background color. ToolNest accepts JPEG, PNG and WebP images up to 20 MB and 40 megapixels.",
    tool: ["/tools/image/image-compressor", "Compress an image"],
  },
  {
    slug: "resize-images-online",
    title: "How to Resize Images Online",
    description: "Resize an image by entering target dimensions, preserve its proportions when needed, then check the exported file before sharing.",
    tag: "Image workflow",
    intro: "Resizing changes an image's pixel dimensions. Choose dimensions that fit the destination, and keep the aspect ratio when you want to avoid stretching or squashing the image.",
    steps: [
      ["Check the destination", "Look for the required width and height in the page, form or document where the image will be used. If it gives only a maximum size, stay within both limits."],
      ["Enter a target size", "Load the image and enter the width and height. Leave preserve aspect ratio enabled to keep the original proportions as dimensions change."],
      ["Preview the result", "Check that the subject still fits and that no important detail was cropped. Resizing changes pixel dimensions; it does not automatically crop the image."],
      ["Download and verify", "Save the resized file and confirm it displays correctly in its destination. Keep a copy of the original if you may need a larger version later."],
    ],
    example: "A 1600 × 1200 photo reduced proportionally to 800 pixels wide becomes 800 × 600. Forcing it to 800 × 800 without preserving proportions would distort its contents.",
    limitations: "Making an image larger cannot recreate missing detail and may look soft. ToolNest supports JPEG, PNG and WebP up to 20 MB and 40 megapixels, with a maximum dimension of 10,000 pixels per side.",
    tool: ["/tools/image/image-resizer", "Resize an image"],
  },
  {
    slug: "merge-pdf-files",
    title: "How to Merge PDF Files",
    description: "Combine PDFs in a deliberate order, check page orientation and content, then save the merged document locally.",
    tag: "PDF workflow",
    intro: "Merging is useful when related pages are spread across separate PDFs. Decide the page order first, since the final document follows the order of the selected files.",
    steps: [
      ["Choose the source files", "Select at least two PDF documents that you are allowed to combine. Check that each file opens and contains the pages you expect."],
      ["Set the order", "Arrange the files in the intended reading sequence before merging. A cover sheet or introductory PDF usually belongs at the beginning."],
      ["Create the combined PDF", "Run the merge and wait for processing to finish in your browser. No account or external upload is required for the merge operation."],
      ["Review the downloaded file", "Open the result and check page count, order, orientation and any forms or annotations that matter to your workflow."],
    ],
    example: "To send a three-part application, place the completed form first, supporting statement second and attachments last, then merge and review all pages in that order.",
    limitations: "ToolNest accepts PDFs up to 50 MB each, with a limit of 20 files, 100 MB combined and 200 output pages. Password-protected or damaged PDFs may not open. Review complex forms, signatures and annotations in the output before relying on it.",
    tool: ["/tools/pdf/merge-pdf", "Merge PDF files"],
  },
  {
    slug: "convert-jpg-to-png",
    title: "How to Convert JPG to PNG",
    description: "Convert a JPEG image to PNG when a workflow requires PNG, while understanding that conversion does not restore lost image detail.",
    tag: "Image workflow",
    intro: "PNG is useful when a receiving application requires that format or when you plan to continue editing. Converting a JPEG to PNG changes the file encoding, but it cannot recover detail that JPEG compression already removed.",
    steps: [
      ["Check whether conversion is needed", "If the destination accepts JPEG, keeping the original avoids an unnecessary copy. Convert only when PNG is required or useful for your next step."],
      ["Select the JPEG", "Choose a JPEG image within the tool's file limits. The converter reads and encodes the image locally in the browser."],
      ["Preview the PNG", "Check dimensions, colors and edges after conversion. The PNG will not gain transparency where the JPEG had none."],
      ["Save with the right extension", "Download the generated .png file and confirm the destination application accepts it."],
    ],
    example: "A JPEG screenshot that needs to enter a PNG-only design workflow can be converted to PNG. The file may be larger, and the conversion does not improve the original screenshot's clarity.",
    limitations: "The converter accepts JPEG/JPG images up to 20 MB and 40 megapixels. PNG output can be larger than the source. JPEG does not store transparency, so a converted PNG remains opaque unless the source pipeline adds transparency separately.",
    tool: ["/tools/image/jpg-to-png", "Convert JPG to PNG"],
  },
  {
    slug: "choosing-image-format", title: "A Practical Guide to Image Formats", description: "Compare JPEG, PNG and WebP by image content, transparency needs and destination support.", tag: "Images",
    intro: "Choose an image format by considering what the picture contains, whether it needs transparency, and what the destination can open.",
    sections: [["JPEG", "JPEG suits photographs and complex images where compact files matter. It does not support transparency, and repeated edits and saves can add compression artifacts."], ["PNG", "PNG preserves crisp edges and supports transparency. It is often useful for diagrams and interface captures, though photographic PNG files can be large."], ["WebP", "WebP supports transparency and can represent photos or graphics efficiently. Confirm the receiving application supports it before replacing a widely compatible source."], ["A practical choice", "Keep an original, choose the format that matches the image and destination, then inspect the result at its intended display size."]],
  },
  {
    slug: "clean-json", title: "How to Make JSON Easier to Read", description: "Use valid JSON syntax and consistent indentation to inspect nested data and track down common parsing mistakes.", tag: "Developer notes",
    intro: "JSON is easier to inspect when nested objects and lists are laid out clearly. Formatting changes whitespace, while syntax checks help catch structural mistakes.",
    sections: [["Use JSON syntax", "Property names and strings use double quotes. Comments and trailing commas are not part of standard JSON."], ["Indent nested values", "Consistent indentation makes arrays and objects easier to scan, especially when the structure is several levels deep."], ["Trace parse errors", "Check the reported line and nearby characters for missing commas, mismatched braces or unescaped quotation marks."], ["Protect sensitive values", "Avoid pasting credentials or private records into a website unless you have checked how that service handles the data."]],
  },
  {
    slug: "clear-writing", title: "Make a First Editing Pass Count", description: "A concise checklist for clarifying a draft while keeping its intended voice and meaning.", tag: "Writing",
    intro: "A focused editing pass can improve clarity without flattening a draft's voice. Start with the reader's need, then review sentences and details.",
    sections: [["Name the reader's need", "Write down what a reader should understand or do. Remove sentences that do not help with that purpose."], ["Prefer concrete language", "Specific nouns and direct verbs usually make actions and ideas easier to follow."], ["Read for flow", "Read aloud or scan line by line for long sentences and abrupt transitions. Split a sentence when it contains several separate ideas."], ["Check details", "Verify names, dates, links and figures against their source before sharing."]],
  },
];

export const getGuide = slug => guides.find(guide => guide.slug === slug);

export const infoPages = {
  about: {
    title: "About ToolNest",
    description: "ToolNest offers free browser-based tools for image, PDF and text tasks, processing selected files and text on your device.",
    sections: [
      ["What ToolNest offers", "The current collection includes image compression, resizing, format conversion and image-to-PDF; PDF merging, splitting, rotation and page export; and text counting, case conversion and duplicate-line removal. The tool directory links to each available utility."],
      ["Why it exists", "ToolNest is intended to make everyday file and text tasks easier to find and complete without installing a separate desktop utility or creating a ToolNest account."],
      ["How processing works", "The tools use browser capabilities and bundled JavaScript libraries to read and process selected files or text in the page. The tool code does not send those file contents to a ToolNest processing server. Ordinary requests needed to load the website still reach the hosting provider."],
      ["What to expect", "Supported formats, file limits and tool-specific behavior are described on each tool page. Results can depend on the input and browser, so review important output before using it."],
    ],
  },
  contact: {
    title: "Contact ToolNest",
    description: "For tool support, feedback, general questions or privacy enquiries, email ToolNest.",
    email: "officialcontact.toolnest@gmail.com",
    sections: [
      ["What you can contact us about", "Email us about tool-related problems and bug reports, suggestions and feature requests, general questions and feedback, or privacy-related enquiries."],
    ],
  },
  privacy: {
    title: "Privacy Policy",
    description: "Learn what ToolNest processes in your browser, what the website does not store, and what technical information may be handled by its hosting provider.",
    sections: [
      ["What happens to files and text", "Image, PDF and text tools process the selected file or entered text in your browser. The current tool code does not upload file contents or text to a ToolNest processing service. Files and text may remain in page memory while a tool is open. Temporary preview and download object URLs are released when the corresponding content changes or the component is removed. ToolNest does not save selected files or text to its own application database or persistent browser storage."],
      ["Retention and downloads", "ToolNest does not retain uploaded files because the current app does not receive or store them. Your browser manages the original file and any downloaded output according to your device and browser settings. Closing the page releases the page's active state; browser memory cleanup is controlled by the browser."],
      ["Website request information", "Loading ToolNest requires requests to the website's hosting origin for pages, scripts, styles, workers and other bundled assets. The hosting provider or any CDN selected for deployment may process technical request information such as IP address, requested path, time, browser or device details, and security logs. The project does not identify a production provider or its log-retention period. The site owner must confirm the provider's practices and disclose applicable retention details before launch."],
      ["Cookies and browser storage", "The current application code does not intentionally read or set cookies, localStorage or sessionStorage. It does use temporary in-memory page state and object URLs for previews and downloads. Hosting infrastructure or browser behavior may differ from the application code and should be checked in the final deployment."],
      ["Analytics and advertising", "No analytics service, advertising network or Google AdSense code is currently integrated. If advertising such as AdSense is added later, it may involve third-party requests, cookies or similar identifiers. The site owner should update this policy and review any applicable notice or consent requirements before enabling it."],
      ["Libraries and other services", "The application bundles Next.js and React for the website, Lucide React for icons, pdf-lib and PDF.js for PDF operations, and browser-compatible JSquash JPEG, WebP and OxiPNG codecs for image processing. These libraries execute in the browser; the PDF.js worker and codec assets are served from the ToolNest deployment. No external file-conversion API or third-party processing endpoint is configured. The structured-data context URL is metadata and is not fetched by the page."],
      ["Privacy questions", "For privacy-related enquiries, email officialcontact.toolnest@gmail.com using the address on the Contact page."],
    ],
  },
  terms: {
    title: "Terms of Service",
    description: "Plain-language terms for using ToolNest tools and guides, including user responsibilities, file limits and availability.",
    sections: [
      ["Using the website", "Use ToolNest only for lawful purposes. Do not interfere with the website, attempt to disrupt its availability, or use it to process content in a way that violates another person's rights or applicable rules."],
      ["Your files and rights", "You are responsible for the files and text you choose to process. Only use material you own or are authorized to handle, and keep a copy of important source files. The fact that a tool runs in your browser does not grant rights to the content."],
      ["File and processing limits", "Limits are shown on individual tool pages and may change as the software evolves. Current general limits include image files up to 20 MB, 10,000 pixels per side and 40 megapixels; image-to-PDF supports up to 50 images and 60 MB combined. PDF tools support files up to 50 MB and 200 pages; merging is limited to 20 files and 100 MB combined. Text inputs are limited to one million characters. Browser memory and supported formats can impose additional practical limits."],
      ["Accuracy and reliability", "Tools are intended for general productivity and may produce incomplete or unsuitable results for a particular file. Check page order, image appearance, text and other important output yourself before relying on or sharing it. Keep source copies where they matter."],
      ["Availability and changes", "ToolNest may be unavailable, changed or discontinued, and individual tools or supported formats may change. No particular uptime, feature or continued availability is promised."],
      ["Limits of responsibility", "To the extent permitted by applicable law, ToolNest is provided as available without a guarantee that it will be uninterrupted, error-free or suitable for a particular purpose. To the extent permitted by law, the site owner is not responsible for indirect or consequential loss arising from use of the website or its output. Nothing in these terms excludes responsibility that applicable law does not allow to be excluded."],
      ["Review before launch", "These general terms do not claim legal compliance in any jurisdiction. The site owner should have the terms reviewed for the final service, hosting arrangement and applicable law before public launch."],
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    description: "ToolNest tools are general productivity utilities. Verify important results, since outputs vary with files, browsers and selected settings.",
    sections: [
      ["General productivity use", "ToolNest tools and guides are provided for general productivity and informational purposes. They are not a substitute for professional judgment or advice tailored to your circumstances."],
      ["Check important output", "Review results before relying on, publishing or sharing them. Confirm that a merged or split PDF contains the intended pages, that a converted image displays correctly, and that transformed text still means what you intend."],
      ["Results vary", "Processing can vary with source-file characteristics, browser support, available memory, selected settings and output format. Image compression does not guarantee a particular percentage reduction; a result may be larger, or the original may be retained when optimization does not help."],
      ["No guarantee", "ToolNest does not guarantee that every file will be supported, that every result will meet a destination's requirements, or that the website will always be available. Check the applicable tool page for formats and limits."],
    ],
  },
};
