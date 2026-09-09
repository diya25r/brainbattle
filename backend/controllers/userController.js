export function getProfile(request, response) {
  const { _id, name, email, xp, level } = request.user

  response.status(200).json({
    success: true,
    user: { id: _id.toString(), name, email, xp, level },
  })
}
