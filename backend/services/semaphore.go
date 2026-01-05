package services

// Semaphore limits concurrent operations
type Semaphore struct {
	ch chan struct{}
}

// NewSemaphore creates a new semaphore with the given capacity
func NewSemaphore(max int) *Semaphore {
	return &Semaphore{
		ch: make(chan struct{}, max),
	}
}

// Acquire blocks until a slot is available
func (s *Semaphore) Acquire() {
	s.ch <- struct{}{}
}

// TryAcquire returns true if a slot was acquired, false otherwise (non-blocking)
func (s *Semaphore) TryAcquire() bool {
	select {
	case s.ch <- struct{}{}:
		return true
	default:
		return false
	}
}

// Release frees a slot
func (s *Semaphore) Release() {
	<-s.ch
}

// Available returns the number of available slots
func (s *Semaphore) Available() int {
	return cap(s.ch) - len(s.ch)
}


