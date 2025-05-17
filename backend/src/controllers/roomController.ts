import * as roomService from '../services/roomService';

//ROLE: validate user input

//Handle user registration
export async function createRoom(req: any, res: any) {
  try {
    //perform basic http request validation
    if (!req.body.room_id || !req.body.user_1) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    //pass the request body to the userService
    const room = await roomService.registerRoom(req.body);

    //Send success back to the client
    res
      .status(201) // ← set status code to 201 Created
      .json({ data: room }); // ← send back JSON payload
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function joinRoom(req: any, res: any) {
  try {
    //perform basic http request validation
    if (!req.body.room_id || !req.body.user_2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    //pass the request body to the userService
    await roomService.joinRoom(req.body);

    //Send success back to the client
    res.status(204).send(); // ← set status code to 201 Created
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteRoom(req: any, res: any) {
  try {
    const { room_id } = req.params;

    if (!room_id) {
      return res.status(400).json({ error: 'Missing required room_id parameter' });
    }

    await roomService.deleteRoom({ room_id });

    // Send success back to the client
    res.status(204).send(); // No content
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}