import * as userService from '../services/userService';

//ROLE: validate user input

export async function signUp(req: any, res: any) {
  try {
    //perform basic http request validation
    if (!req.body.email || !req.body.user_id) {
      return res.status(400).json({ error: 'Missing required fields for signup' });
    }
    //pass the request body to the userService
    // 2) Service-layer call
    const newUser = await userService.registerUser(req.body);

    // 3) Return created
    return res
      .status(201) // Created
      .json({ data: newUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function onboard(req: any, res: any) {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.birthdate || !req.body.photo_url) {
      return res.status(400).json({ error: 'Missing required fields for onboarding' });
    }

    // Pass the request to the service layer
    const updatedUser = await userService.onboardUser(req.body);

    // 3) Return created
    return res
      .status(201) // Created
      .json({ data: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function fetchUser(req: any, res: any) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: 'Missing required userId to fetch user' });
    }
    const user = await userService.fetchUser({ userId });
    return res.status(200).json({ data: user });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
