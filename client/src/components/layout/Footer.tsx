import React from 'react'

const Footer:React.FC = () => {
  return (
    <div className="max-w-6xl mt-5 mx-auto w-full px-4 md:px-8 overflow-hidden">
        <img
          src="/images/footer.png"
          alt="Footer Image"
          className="w-full h-[120px] sm:h-[180px] md:h-[220px] object-contain object-bottom pointer-events-none"
          style={{ display: 'block' }}
        />
      </div>
  )
}

export default Footer