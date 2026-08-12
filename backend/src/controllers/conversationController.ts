import { Response, NextFunction } from 'express';
import { ConversationModel } from '../models/Conversation';
import { UserModel } from '../models/User';
import { successResponse, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { createConversationSchema } from '../validators/schemas';
import { AuthRequest } from '../middleware/auth';

// GET /api/conversations
export async function listConversations(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const conversations = await ConversationModel.listForUser(req.userId!);
    res.json(successResponse(conversations));
  } catch (err) {
    next(err);
  }
}

// POST /api/conversations
export async function createOrGetConversation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = createConversationSchema.parse(req.body);
    const otherUserId = body.participant_id;

    if (otherUserId === req.userId) {
      throw new ForbiddenError('You cannot start a conversation with yourself', 'SELF_CONVERSATION');
    }

    const otherUser = await UserModel.findById(otherUserId);
    if (!otherUser || !otherUser.is_active) {
      throw new NotFoundError('User not found');
    }

    const { conversation, created } = await ConversationModel.getOrCreate(req.userId!, otherUserId);
    res.status(created ? 201 : 200).json(
      successResponse({ ...conversation, other_user: UserModel.toPublic(otherUser) })
    );
  } catch (err) {
    next(err);
  }
}

// GET /api/conversations/:id
export async function getConversation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const isParticipant = await ConversationModel.isParticipant(req.params.id, req.userId!);
    if (!isParticipant) throw new ForbiddenError('Access denied');

    const otherUserId = await ConversationModel.getOtherParticipantId(req.params.id, req.userId!);
    if (!otherUserId) throw new NotFoundError('Conversation not found');

    const otherUser = await UserModel.findById(otherUserId);
    res.json(
      successResponse({
        id: req.params.id,
        other_user: otherUser ? UserModel.toPublic(otherUser) : null,
      })
    );
  } catch (err) {
    next(err);
  }
}
