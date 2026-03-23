"use client";

import { CldUploadWidget } from 'next-cloudinary';

interface UploadMealButtonProps {
  onUploadSuccess: (url: string) => void; // دالة نستدعيها لما الرفع يخلص عشان نحفظ الرابط
}

export default function UploadMealButton({ onUploadSuccess }: UploadMealButtonProps) {
  return (
    <CldUploadWidget
      uploadPreset="your_upload_preset_name" // TODO: Replace with your actual upload preset name
      onSuccess={(result, { widget }) => {
        if (result.event !== 'success') return;
        // الرفع نجح!
        // هنا نمسك الرابط ونرسله للأب (عشان تخزنه في الداتابيس أو ترسله للـ AI)
        if (typeof result.info === 'object' && result.info && 'secure_url' in result.info) {
             onUploadSuccess(result.info.secure_url as string);
        }
        
        widget.close();
      }}
    >
      {({ open }) => {
        return (
          <button
            onClick={() => open()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
          >
            {/* أيقونة كاميرا بسيطة */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            صور وجبتك
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
