import prisma from "../lib/prisma.js";

export const getChats = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chats = await prisma.chat.findMany({
      where: {
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
    });

    // Ідемо по кожному чату
    for (const chat of chats) {
      // Знаходимо айді іншого користувача
      const receiverId = chat.userIDs.find((id) => id !== tokenUserId);

      let receiver = null;

      if (receiverId) {
        // Шукаємо користувача тільки якщо знайшли receiverId
        receiver = await prisma.user.findUnique({
          where: {
            id: receiverId,
          },
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        });
      } else {
        console.warn(`Chat ${chat.id} має тільки одного користувача!`);
      }

      // Додаємо поле receiver (може бути null)
      chat.receiver = receiver;
    }

    res.status(200).json(chats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to get chats!" });
  }
};

export const getChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.findUnique({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    await prisma.chat.update({
      where: {
        id: req.params.id,
      },
      data: {
        seenBy: {
          push: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to get chat!" });
  }
};

export const addChat = async (req, res) => {
  const tokenUserId = req.userId;
  const receiverId = req.body.receiverId;
  // console.log("addChat → tokenUserId:", tokenUserId, "receiverId:", receiverId);

  if (!receiverId || receiverId === tokenUserId) {
    // return res.status(400).json({ message: "Invalid receiverId" });
    return res.status(400).json({
      message: "Invalid receiverId",
      details: {
        tokenUserId,
        receiverId,
      },
    });
  }

  try {
    const newChat = await prisma.chat.create({
      data: {
        userIDs: [tokenUserId, receiverId],
        users: {
          connect: [{ id: tokenUserId }, { id: receiverId }],
        },
      },
    });
    res.status(200).json(newChat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add chat!" });
  }
};

export const readChat = async (req, res) => {
  const tokenUserId = req.userId;

  try {
    const chat = await prisma.chat.update({
      where: {
        id: req.params.id,
        userIDs: {
          hasSome: [tokenUserId],
        },
      },
      data: {
        seenBy: {
          set: [tokenUserId],
        },
      },
    });
    res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to read chat!" });
  }
};
