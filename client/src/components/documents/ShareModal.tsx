import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Copy, 
  Download,
  Share2,
  MessageCircle,
  Send,
  Link,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { UserDocument, Document } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ShareModalProps {
  document: UserDocument | Document;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
}

interface ShareOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
  description?: string;
}

export default function ShareModal({
  document,
  isOpen,
  onClose,
  onDownload
}: ShareModalProps) {
  const [emailAddress, setEmailAddress] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const { toast } = useToast();

  const isUserDocument = 'userId' in document;

  // Generate share URL and default message
  useEffect(() => {
    if (isOpen) {
      const baseUrl = window.location.origin;
      let url = '';
      
      if (isUserDocument) {
        // For user documents, create a generic share URL
        url = `${baseUrl}/document-repository`;
      } else {
        // For compliance documents, link directly to the document
        url = `${baseUrl}/documents/${document.id}`;
      }
      
      setShareUrl(url);
      setEmailMessage(`Hi!\n\nI wanted to share this document with you: "${document.title}"\n\nYou can view it here: ${url}\n\nBest regards`);
    }
  }, [isOpen, document, isUserDocument]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmailAddress('');
      setEmailMessage('');
      setCopySuccess(false);
      setEmailSending(false);
    }
  }, [isOpen]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      toast({
        title: "Link Copied",
        description: "Document link has been copied to clipboard.",
      });
      
      // Reset copy success state after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleEmailShare = async () => {
    if (!emailAddress.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address.",
        variant: "destructive",
      });
      return;
    }

    setEmailSending(true);
    
    try {
      // Create mailto link for now - in production you'd send via backend API
      const subject = encodeURIComponent(`Shared Document: ${document.title}`);
      const body = encodeURIComponent(emailMessage);
      const mailtoLink = `mailto:${emailAddress}?subject=${subject}&body=${body}`;
      
      window.open(mailtoLink, '_blank');
      
      toast({
        title: "Email Opened",
        description: "Your email client has been opened with the document link.",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Email Failed",
        description: "Could not open email client.",
        variant: "destructive",
      });
    } finally {
      setEmailSending(false);
    }
  };

  const handleSocialShare = (platform: string) => {
    const text = `Check out this document: "${document.title}"`;
    const url = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        break;
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedText}%20${url}`;
        break;
      case 'telegram':
        shareLink = `https://t.me/share/url?url=${url}&text=${encodedText}`;
        break;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

     const handleNativeShare = async () => {
     if ('share' in navigator) {
       try {
         await navigator.share({
           title: document.title,
           text: `Check out this document: "${document.title}"`,
           url: shareUrl,
         });
         
         toast({
           title: "Shared Successfully",
           description: "Document has been shared.",
         });
       } catch (error) {
         if ((error as Error).name !== 'AbortError') {
           toast({
             title: "Share Failed",
             description: "Could not share document.",
             variant: "destructive",
           });
         }
       }
     }
   };

  const shareOptions: ShareOption[] = [
    {
      id: 'copy',
      name: 'Copy Link',
      icon: copySuccess ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />,
      color: copySuccess ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200',
      action: handleCopyLink,
      description: 'Copy link to clipboard'
    },
         ...('share' in navigator ? [{
       id: 'native',
       name: 'Share',
       icon: <Share2 className="w-5 h-5" />,
       color: 'bg-purple-50 text-purple-600 border-purple-200',
       action: handleNativeShare,
       description: 'Use device share menu'
     }] : []),
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      action: () => handleSocialShare('facebook'),
      description: 'Share on Facebook'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-sky-50 text-sky-600 border-sky-200',
      action: () => handleSocialShare('twitter'),
      description: 'Share on Twitter'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => handleSocialShare('linkedin'),
      description: 'Share on LinkedIn'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-50 text-green-600 border-green-200',
      action: () => handleSocialShare('whatsapp'),
      description: 'Share via WhatsApp'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      color: 'bg-blue-50 text-blue-500 border-blue-200',
      action: () => handleSocialShare('telegram'),
      description: 'Share via Telegram'
    },
    ...(onDownload ? [{
      id: 'download',
      name: 'Download',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-gray-50 text-gray-600 border-gray-200',
      action: () => {
        onDownload();
        onClose();
      },
      description: 'Download document'
    }] : [])
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Share Document
                </h2>
                <p className="text-sm text-gray-500">
                  Share "{document.title}" with others
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="rounded-full w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
            {/* Document Info */}
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <span className="font-medium text-gray-900">Document Information</span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Title:</span> {document.title}</p>
                <p><span className="font-medium">Type:</span> {isUserDocument ? 'User Document' : 'Compliance Document'}</p>
                {isUserDocument && (
                  <p><span className="font-medium">Note:</span> Shared link will direct to document repository</p>
                )}
              </div>
            </div>

            {/* Quick Share Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                Quick Share Options
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {shareOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={option.action}
                    className={`
                      flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all duration-200
                      hover:shadow-md ${option.color}
                    `}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.name}</span>
                    {option.description && (
                      <span className="text-xs opacity-75 text-center">{option.description}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Email Share */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                Share via Email
              </Label>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="Enter email address"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter your message"
                    className="mt-1 min-h-[100px] resize-none"
                  />
                </div>
                <Button
                  onClick={handleEmailShare}
                  disabled={emailSending || !emailAddress.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {emailSending ? 'Opening Email...' : 'Send Email'}
                </Button>
              </div>
            </div>

            {/* Link Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-900">
                Share Link
              </Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className={copySuccess ? 'text-green-600 border-green-300' : ''}
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <div className="text-xs text-gray-500">
              Recipients will need appropriate access to view the document
            </div>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 