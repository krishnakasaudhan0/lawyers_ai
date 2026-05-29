const chatmodel=require('../models/chat.model');
const geminiresponse=require('../models/message.model');

async function newchatcontroller(req,res){
    try{
        const chatsession=await chatmodel.create({});
        res.status(200).json({message:'Chat session created successfully'});
        return chatsession._id;
    }
    catch(err){
        console.error('Error creating chat session:', err);
        res.status(500).json({message:'Failed to create chat session'});
    }
   
}
async function getallsessionscontroller(req,res){
    try{
        const userId = req.user._id; // Assuming auth middleware sets req.user
        const sessions = await chatmodel.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(sessions);
    }
    catch(err){
        console.error('Error fetching chat sessions:', err);
        res.status(500).json({message:'Failed to fetch chat sessions'});
    }
}

async function getsessionbyidcontroller(req,res){
    try{
        const sessionId = req.params.id;
        const session = await chatmodel.findById(sessionId);
        if (!session) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        res.status(200).json(session);
    }
    catch(err){
        console.error('Error fetching chat session:', err);
        res.status(500).json({message:'Failed to fetch chat session'});
    }
}
//gemini entry point for messages

async function addmessagecontroller(req,res){
    const { content, sender, tokenCount } = req.body;
    const sessionId = req.params.id;
    // Validate input
    if (!content || !sender) {
        return res.status(400).json({ message: 'Content and sender are required' });
    }
    try {
        // Check if chat session exists
        const chatSession = await chatmodel.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }


        // Create new message
        const newMessage = await messagemodel.create({
            sessionId,
            sender,
            content,
            tokenCount: tokenCount || 0
        });
        const chathistory = await messagemodel.find({ sessionId }).sort({ createdAt: 1 });
        const prompt = chathistory.map(msg => `${msg.sender}: ${msg.content}`).join('\n');
        const responseFromGemini = await getResponsefromGemini(prompt);
        await messagemodel.create({
            sessionId,
            sender: 'assistant',
            content: responseFromGemini,
            tokenCount: 0 // You can calculate token count based on the response if needed
        });
        res.status(201).json(newMessage);
    } catch (err) {
        console.error('Error adding message:', err);
        res.status(500).json({ message: 'Failed to add message' });
    }   
    // Implementation for adding a message to a chat session
}

async function getmessagesbyidcontroller(req,res){
        const sessionId = req.params.id;
    try {        // Check if chat session exists
        const chatSession = await chatmodel.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        // Fetch messages for the chat session
        const messages = await messagemodel.find({ sessionId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }   
    // Implementation for fetching messages of a chat session
}

async function archivechatcontroller(req,res){
    // Implementation for archiving a chat session
    const sessionId = req.params.id;
    try {
        const chatSession = await chatmodel.findById(sessionId);
        if (!chatSession) {
            return res.status(404).json({ message: 'Chat session not found' });
        }
        chatSession.status = 'archived';
        await chatSession.save();
        res.status(200).json({ message: 'Chat session archived successfully' });
    } catch (err) {
        console.error('Error archiving chat session:', err);
        res.status(500).json({ message: 'Failed to archive chat session' });
    }   
}   

export {newchatcontroller,getallsessionscontroller,getsessionbyidcontroller,addmessagecontroller,getmessagesbyidcontroller,archivechatcontroller};